import { db } from '@/lib/db';
import { sessions, sessionAudioMetrics, users, alerts, tutors } from '@/lib/db';
import { eq, and, count, avg, sql, desc, lt, gte, lte } from 'drizzle-orm';
import type { AlertSeverityType } from '@/lib/db/types';
import { withCache, generateCacheKey, getCacheManager, CACHE_PREFIXES, CACHE_TTL } from '@/lib/cache';

// ============================================
// TYPESCRIPT INTERFACES
// ============================================

export interface PlatformHealthMetrics {
  avgSessionScore: number | null;
  avgSessionScoreTrend: number | null;
  firstSessionConvertRate: number | null;
  firstSessionConvertRateTrend: number | null;
  tutorChurnRiskCount: number;
  tutorChurnRiskCountTrend: number | null;
  noShowRate: number | null;
  noShowRateTrend: number | null;
}

export interface TutorPerformance {
  tutor_id: string;
  tutor_name: string;
  overall_score: number;
  session_count: number;
}

export interface TutorAlert {
  tutor_id: string;
  tutor_name: string;
  overall_score: number | null;
  alert_count: number;
  critical_alert_count: number;
  has_critical: boolean;
}

export interface DateRange {
  start: Date;
  end: Date;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Calculate percentage change between current and previous values
 * @param current - Current period value
 * @param previous - Previous period value
 * @returns Percentage change (positive or negative) or null if cannot calculate
 */
export function calculateTrendPercentage(current: number | null, previous: number | null): number | null {
  if (current === null || previous === null || previous === 0) {
    return null;
  }
  return ((current - previous) / previous) * 100;
}

/**
 * Get date range for previous period (same duration as current period)
 */
function getPreviousPeriod(dateRange: DateRange): DateRange {
  const duration = dateRange.end.getTime() - dateRange.start.getTime();
  return {
    start: new Date(dateRange.start.getTime() - duration),
    end: new Date(dateRange.start.getTime()),
  };
}

/**
 * Get default date range (last 30 days)
 */
function getDefaultDateRange(): DateRange {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 30);
  return { start, end };
}

// ============================================
// SERVICE FUNCTIONS
// ============================================

/**
 * Calculate platform-wide health metrics for admin dashboard
 *
 * This function is cached for 5 minutes to improve performance on the admin dashboard.
 * Expensive aggregations across all sessions are minimized by caching.
 *
 * @param dateRange - Optional date range, defaults to last 30 days
 * @returns Platform health metrics with trend indicators
 */
export async function getPlatformHealthMetrics(dateRange?: DateRange): Promise<PlatformHealthMetrics> {
  const range = dateRange || getDefaultDateRange();

  const cacheKey = generateCacheKey(CACHE_PREFIXES.PLATFORM, {
    metric: 'health',
    start: range.start.toISOString(),
    end: range.end.toISOString(),
  });

  return withCache(cacheKey, CACHE_TTL.SHORT, async () => {
    try {
      const previousRange = getPreviousPeriod(range);

      // Calculate current period metrics
      const [
        currentAvgScore,
        currentConvertRate,
        currentChurnRiskCount,
        currentNoShowRate
      ] = await Promise.all([
        calculateAvgSessionScore(range),
        calculateFirstSessionConvertRate(range),
        calculateTutorChurnRiskCount(),
        calculateNoShowRate(range),
      ]);

      // Calculate previous period metrics for trends
      const [
        previousAvgScore,
        previousConvertRate,
        previousNoShowRate
      ] = await Promise.all([
        calculateAvgSessionScore(previousRange),
        calculateFirstSessionConvertRate(previousRange),
        calculateNoShowRate(previousRange),
      ]);

      // Note: Churn risk count is a point-in-time metric, so we don't calculate trend for it
      // In a real implementation, we'd store historical snapshots to track this

      return {
        avgSessionScore: currentAvgScore,
        avgSessionScoreTrend: calculateTrendPercentage(currentAvgScore, previousAvgScore),
        firstSessionConvertRate: currentConvertRate,
        firstSessionConvertRateTrend: calculateTrendPercentage(currentConvertRate, previousConvertRate),
        tutorChurnRiskCount: currentChurnRiskCount,
        tutorChurnRiskCountTrend: null, // Would need historical data
        noShowRate: currentNoShowRate,
        noShowRateTrend: calculateTrendPercentage(currentNoShowRate, previousNoShowRate),
      };
    } catch (error) {
      console.error('Error in getPlatformHealthMetrics:', error);
      throw new Error('Failed to calculate platform health metrics: ' + (error as Error).message);
    }
  });
}

/**
 * Get top performing tutors by average session score
 *
 * This function is cached for 10 minutes to balance freshness with performance.
 * Results are based on aggregated session scores in the specified date range.
 *
 * @param limit - Number of tutors to return
 * @param dateRange - Optional date range filter
 * @returns Array of top performing tutors
 */
export async function getTopPerformers(limit: number, dateRange?: DateRange): Promise<TutorPerformance[]> {
  const range = dateRange || getDefaultDateRange();

  const cacheKey = generateCacheKey(CACHE_PREFIXES.PLATFORM, {
    metric: 'top_performers',
    limit,
    start: range.start.toISOString(),
    end: range.end.toISOString(),
  });

  return withCache(cacheKey, 10 * 60, async () => {
    try {
      const conditions = [
        eq(sessions.status, 'completed'),
        gte(sessions.scheduled_start, range.start),
        lte(sessions.scheduled_start, range.end),
      ];

      // Query tutors with their average scores and session counts
      const result = await db
        .select({
          tutor_id: sessions.tutor_id,
          tutor_name: users.name,
          overall_score: sql<number>`CAST(AVG(CAST(${sessions.overall_session_score} AS DECIMAL)) AS DECIMAL)`,
          session_count: count(sessions.id),
        })
        .from(sessions)
        .innerJoin(users, eq(sessions.tutor_id, users.id))
        .where(and(...conditions))
        .groupBy(sessions.tutor_id, users.name)
        .having(sql`COUNT(${sessions.id}) >= 5`) // Minimum 5 sessions to qualify
        .orderBy(desc(sql`AVG(CAST(${sessions.overall_session_score} AS DECIMAL))`))
        .limit(limit);

      return result.map(r => ({
        tutor_id: r.tutor_id,
        tutor_name: r.tutor_name,
        overall_score: r.overall_score ? Number(r.overall_score) : 0,
        session_count: Number(r.session_count),
      }));
    } catch (error) {
      console.error('Error in getTopPerformers:', error);
      throw new Error('Failed to fetch top performers: ' + (error as Error).message);
    }
  });
}

/**
 * Get tutors that need attention (low scores or active alerts)
 *
 * This function is cached for 5 minutes since it's critical for identifying issues quickly.
 * Shorter TTL ensures admins see issues with minimal delay.
 *
 * @param limit - Number of tutors to return
 * @param dateRange - Optional date range filter
 * @returns Array of tutors with issues
 */
export async function getNeedsAttention(limit: number, dateRange?: DateRange): Promise<TutorAlert[]> {
  const range = dateRange || getDefaultDateRange();

  const cacheKey = generateCacheKey(CACHE_PREFIXES.PLATFORM, {
    metric: 'needs_attention',
    limit,
    start: range.start.toISOString(),
    end: range.end.toISOString(),
  });

  return withCache(cacheKey, CACHE_TTL.SHORT, async () => {
    try {
      // Get all tutors
      const allTutors = await db
        .select({
          tutor_id: tutors.user_id,
        })
        .from(tutors);

      // For each tutor, get their alerts and recent score
      const tutorData = await Promise.all(
        allTutors.map(async (tutor) => {
          const [alertData, scoreData] = await Promise.all([
            // Get alert counts
            db
              .select({
                total: count(alerts.id),
                critical: sql<number>`COUNT(CASE WHEN ${alerts.severity} = 'critical' THEN 1 END)`,
              })
              .from(alerts)
              .where(
                and(
                  eq(alerts.tutor_id, tutor.tutor_id),
                  eq(alerts.resolved, false)
                )
              ),
            // Get recent average score
            db
              .select({
                tutor_name: users.name,
                avg_score: sql<number>`AVG(CAST(${sessions.overall_session_score} AS DECIMAL))`,
              })
              .from(sessions)
              .innerJoin(users, eq(sessions.tutor_id, users.id))
              .where(
                and(
                  eq(sessions.tutor_id, tutor.tutor_id),
                  eq(sessions.status, 'completed'),
                  gte(sessions.scheduled_start, range.start),
                  lte(sessions.scheduled_start, range.end)
                )
              )
              .groupBy(users.name),
          ]);

          const alertCount = Number(alertData[0]?.total || 0);
          const criticalCount = Number(alertData[0]?.critical || 0);
          const avgScore = scoreData[0]?.avg_score ? Number(scoreData[0].avg_score) : null;
          const tutorName = scoreData[0]?.tutor_name || 'Unknown';

          return {
            tutor_id: tutor.tutor_id,
            tutor_name: tutorName,
            overall_score: avgScore,
            alert_count: alertCount,
            critical_alert_count: criticalCount,
            has_critical: criticalCount > 0,
          };
        })
      );

      // Filter to only tutors with alerts or low scores
      const needsAttention = tutorData.filter(
        t => t.alert_count > 0 || (t.overall_score !== null && t.overall_score < 6.5)
      );

      // Sort by severity: critical alerts first, then by score, then by alert count
      needsAttention.sort((a, b) => {
        if (a.has_critical !== b.has_critical) {
          return a.has_critical ? -1 : 1;
        }
        if (a.overall_score !== null && b.overall_score !== null) {
          return a.overall_score - b.overall_score;
        }
        if (a.overall_score === null && b.overall_score !== null) {
          return 1;
        }
        if (a.overall_score !== null && b.overall_score === null) {
          return -1;
        }
        return b.alert_count - a.alert_count;
      });

      return needsAttention.slice(0, limit);
    } catch (error) {
      console.error('Error in getNeedsAttention:', error);
      throw new Error('Failed to fetch tutors needing attention: ' + (error as Error).message);
    }
  });
}

// ============================================
// INTERNAL CALCULATION FUNCTIONS
// ============================================

/**
 * Calculate average session score for a date range
 */
async function calculateAvgSessionScore(dateRange: DateRange): Promise<number | null> {
  try {
    const result = await db
      .select({
        avg_score: avg(sessions.overall_session_score),
      })
      .from(sessions)
      .where(
        and(
          eq(sessions.status, 'completed'),
          gte(sessions.scheduled_start, dateRange.start),
          lte(sessions.scheduled_start, dateRange.end)
        )
      );

    return result[0]?.avg_score ? Number(result[0].avg_score) : null;
  } catch (error) {
    console.error('Error calculating avg session score:', error);
    return null;
  }
}

/**
 * Calculate first session convert rate
 * Percentage of session_number=1 sessions that lead to session_number=2
 */
async function calculateFirstSessionConvertRate(dateRange: DateRange): Promise<number | null> {
  try {
    // Get all first sessions in the date range
    const firstSessions = await db
      .select({
        tutor_id: sessions.tutor_id,
        student_id: sessions.student_id,
      })
      .from(sessions)
      .where(
        and(
          eq(sessions.session_number, 1),
          eq(sessions.status, 'completed'),
          gte(sessions.scheduled_start, dateRange.start),
          lte(sessions.scheduled_start, dateRange.end)
        )
      );

    if (firstSessions.length === 0) {
      return null;
    }

    // Check how many led to a second session
    let convertedCount = 0;
    for (const firstSession of firstSessions) {
      const secondSession = await db
        .select({ id: sessions.id })
        .from(sessions)
        .where(
          and(
            eq(sessions.tutor_id, firstSession.tutor_id),
            eq(sessions.student_id, firstSession.student_id),
            eq(sessions.session_number, 2)
          )
        )
        .limit(1);

      if (secondSession.length > 0) {
        convertedCount++;
      }
    }

    return (convertedCount / firstSessions.length) * 100;
  } catch (error) {
    console.error('Error calculating first session convert rate:', error);
    return null;
  }
}

/**
 * Calculate count of tutors at high churn risk
 * This is simplified - in a real implementation, we'd call getTutorChurnRisk for each tutor
 */
async function calculateTutorChurnRiskCount(): Promise<number> {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get all tutors
    const allTutors = await db
      .select({
        tutor_id: tutors.user_id,
      })
      .from(tutors);

    // For each tutor, check if they're at high risk
    let highRiskCount = 0;
    for (const tutor of allTutors) {
      // Count no-shows in last 30 days
      const noShowCount = await db
        .select({ count: count() })
        .from(sessions)
        .where(
          and(
            eq(sessions.tutor_id, tutor.tutor_id),
            sql`${sessions.status} IN ('no_show_tutor', 'no_show_student')`,
            gte(sessions.scheduled_start, thirtyDaysAgo)
          )
        );

      // Count reschedules in last 30 days
      const rescheduleCount = await db
        .select({ count: count() })
        .from(sessions)
        .where(
          and(
            eq(sessions.tutor_id, tutor.tutor_id),
            eq(sessions.status, 'rescheduled'),
            gte(sessions.scheduled_start, thirtyDaysAgo)
          )
        );

      const noShows = Number(noShowCount[0]?.count || 0);
      const reschedules = Number(rescheduleCount[0]?.count || 0);

      // High risk threshold: >= 2 no-shows OR >= 5 reschedules
      if (noShows >= 2 || reschedules >= 5) {
        highRiskCount++;
      }
    }

    return highRiskCount;
  } catch (error) {
    console.error('Error calculating tutor churn risk count:', error);
    return 0;
  }
}

/**
 * Calculate no-show rate (no-show sessions / total scheduled sessions)
 */
async function calculateNoShowRate(dateRange: DateRange): Promise<number | null> {
  try {
    // Count total scheduled sessions (excluding cancelled)
    const totalResult = await db
      .select({ count: count() })
      .from(sessions)
      .where(
        and(
          sql`${sessions.status} NOT IN ('cancelled')`,
          gte(sessions.scheduled_start, dateRange.start),
          lte(sessions.scheduled_start, dateRange.end)
        )
      );

    const total = Number(totalResult[0]?.count || 0);
    if (total === 0) {
      return null;
    }

    // Count no-show sessions
    const noShowResult = await db
      .select({ count: count() })
      .from(sessions)
      .where(
        and(
          sql`${sessions.status} IN ('no_show_tutor', 'no_show_student')`,
          gte(sessions.scheduled_start, dateRange.start),
          lte(sessions.scheduled_start, dateRange.end)
        )
      );

    const noShows = Number(noShowResult[0]?.count || 0);

    return (noShows / total) * 100;
  } catch (error) {
    console.error('Error calculating no-show rate:', error);
    return null;
  }
}

// ============================================
// CACHE INVALIDATION
// ============================================

/**
 * Invalidate all platform-related cache entries
 *
 * Call this function when new session data is added or when platform-wide
 * metrics need to be recalculated (e.g., after batch processing).
 */
export function invalidatePlatformCache(): void {
  const cache = getCacheManager();
  cache.deleteByPrefix(CACHE_PREFIXES.PLATFORM);
}
