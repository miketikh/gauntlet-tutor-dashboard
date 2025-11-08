import { db } from '@/lib/db';
import { sessions, users, subjects, alerts, sessionAudioMetrics, sessionFeedback } from '@/lib/db';
import { eq, desc, and, sql, gte, lte, count, avg, isNull, inArray } from 'drizzle-orm';

// ============================================
// TypeScript Interfaces
// ============================================

export interface PlatformMetrics {
  avgSessionScore: number;
  avgSessionScoreTrend: 'up' | 'down' | 'neutral';
  firstSessionConvertRate: number;
  firstSessionConvertRateTrend: 'up' | 'down' | 'neutral';
  tutorChurnRiskCount: number;
  noShowRate: number;
  noShowRateTrend: 'up' | 'down' | 'neutral';
}

export interface TopPerformer {
  user_id: string;
  name: string;
  overall_score: number;
  session_count: number;
}

export interface TutorNeedingAttention {
  user_id: string;
  name: string;
  overall_score: number;
  active_alert_count: number;
  churn_risk_level: 'low' | 'medium' | 'high';
}

export interface RecentSession {
  id: string;
  scheduled_start: Date;
  subject_name: string;
  tutor_name: string;
  overall_session_score: number | null;
  student_engagement_score: number | null;
  student_satisfaction_rating: number | null;
  is_flagged: boolean;
}

// ============================================
// Helper Functions
// ============================================

/**
 * Calculate trend direction by comparing current and previous values
 * @param current - Current period value
 * @param previous - Previous period value
 * @returns Trend direction: "up", "down", or "neutral"
 */
export function calculateTrend(current: number, previous: number): 'up' | 'down' | 'neutral' {
  const threshold = 0.01; // 1% threshold for neutral
  const percentChange = previous === 0 ? 0 : Math.abs(current - previous) / previous;

  if (percentChange < threshold) {
    return 'neutral';
  }

  return current > previous ? 'up' : 'down';
}

/**
 * Get date range for current and previous periods (last 30 days vs prior 30 days)
 */
function getPeriodDates() {
  const now = new Date();
  const currentPeriodStart = new Date(now);
  currentPeriodStart.setDate(now.getDate() - 30);

  const previousPeriodStart = new Date(currentPeriodStart);
  previousPeriodStart.setDate(currentPeriodStart.getDate() - 30);

  return {
    currentStart: currentPeriodStart,
    currentEnd: now,
    previousStart: previousPeriodStart,
    previousEnd: currentPeriodStart,
  };
}

// ============================================
// Service Functions
// ============================================

/**
 * Get platform-wide metrics with trend comparisons
 * @returns Platform metrics including averages, rates, and trends
 */
export async function getPlatformMetrics(): Promise<PlatformMetrics> {
  try {
    const dates = getPeriodDates();

    // Calculate average session score for current period
    const currentScoreResult = await db
      .select({ avgScore: avg(sessions.overall_session_score) })
      .from(sessions)
      .where(
        and(
          gte(sessions.scheduled_start, dates.currentStart),
          lte(sessions.scheduled_start, dates.currentEnd),
          eq(sessions.status, 'completed')
        )
      );

    const currentAvgScore = Number(currentScoreResult[0]?.avgScore ?? 0);

    // Calculate average session score for previous period
    const previousScoreResult = await db
      .select({ avgScore: avg(sessions.overall_session_score) })
      .from(sessions)
      .where(
        and(
          gte(sessions.scheduled_start, dates.previousStart),
          lte(sessions.scheduled_start, dates.previousEnd),
          eq(sessions.status, 'completed')
        )
      );

    const previousAvgScore = Number(previousScoreResult[0]?.avgScore ?? 0);

    // Calculate first session convert rate (current period)
    const firstSessionsCurrentResult = await db
      .select({
        total: count(),
        converted: sql<number>`COUNT(CASE WHEN ${sessions.follow_up_booked} = true THEN 1 END)`,
      })
      .from(sessions)
      .where(
        and(
          eq(sessions.session_number, 1),
          gte(sessions.scheduled_start, dates.currentStart),
          lte(sessions.scheduled_start, dates.currentEnd),
          eq(sessions.status, 'completed')
        )
      );

    const currentTotal = Number(firstSessionsCurrentResult[0]?.total ?? 0);
    const currentConverted = Number(firstSessionsCurrentResult[0]?.converted ?? 0);
    const currentConvertRate = currentTotal > 0 ? currentConverted / currentTotal : 0;

    // Calculate first session convert rate (previous period)
    const firstSessionsPreviousResult = await db
      .select({
        total: count(),
        converted: sql<number>`COUNT(CASE WHEN ${sessions.follow_up_booked} = true THEN 1 END)`,
      })
      .from(sessions)
      .where(
        and(
          eq(sessions.session_number, 1),
          gte(sessions.scheduled_start, dates.previousStart),
          lte(sessions.scheduled_start, dates.previousEnd),
          eq(sessions.status, 'completed')
        )
      );

    const previousTotal = Number(firstSessionsPreviousResult[0]?.total ?? 0);
    const previousConverted = Number(firstSessionsPreviousResult[0]?.converted ?? 0);
    const previousConvertRate = previousTotal > 0 ? previousConverted / previousTotal : 0;

    // Calculate tutor churn risk count (tutors with >= 2 no-shows OR >= 5 reschedules in last 30 days)
    const tutorChurnRiskResult = await db
      .select({
        tutor_id: sessions.tutor_id,
        noShowCount: sql<number>`COUNT(CASE WHEN ${sessions.status} = 'no_show_tutor' THEN 1 END)`,
        rescheduleCount: sql<number>`COUNT(CASE WHEN ${sessions.rescheduled_by} = 'tutor' THEN 1 END)`,
      })
      .from(sessions)
      .where(
        and(
          gte(sessions.scheduled_start, dates.currentStart),
          lte(sessions.scheduled_start, dates.currentEnd)
        )
      )
      .groupBy(sessions.tutor_id);

    const tutorChurnRiskCount = tutorChurnRiskResult.filter(
      (t) => Number(t.noShowCount) >= 2 || Number(t.rescheduleCount) >= 5
    ).length;

    // Calculate no-show rate for current period
    const currentNoShowResult = await db
      .select({
        total: count(),
        noShows: sql<number>`COUNT(CASE WHEN ${sessions.status} IN ('no_show_tutor', 'no_show_student') THEN 1 END)`,
      })
      .from(sessions)
      .where(
        and(
          gte(sessions.scheduled_start, dates.currentStart),
          lte(sessions.scheduled_start, dates.currentEnd)
        )
      );

    const currentNoShowTotal = Number(currentNoShowResult[0]?.total ?? 0);
    const currentNoShows = Number(currentNoShowResult[0]?.noShows ?? 0);
    const currentNoShowRate = currentNoShowTotal > 0 ? currentNoShows / currentNoShowTotal : 0;

    // Calculate no-show rate for previous period
    const previousNoShowResult = await db
      .select({
        total: count(),
        noShows: sql<number>`COUNT(CASE WHEN ${sessions.status} IN ('no_show_tutor', 'no_show_student') THEN 1 END)`,
      })
      .from(sessions)
      .where(
        and(
          gte(sessions.scheduled_start, dates.previousStart),
          lte(sessions.scheduled_start, dates.previousEnd)
        )
      );

    const previousNoShowTotal = Number(previousNoShowResult[0]?.total ?? 0);
    const previousNoShows = Number(previousNoShowResult[0]?.noShows ?? 0);
    const previousNoShowRate = previousNoShowTotal > 0 ? previousNoShows / previousNoShowTotal : 0;

    return {
      avgSessionScore: currentAvgScore,
      avgSessionScoreTrend: calculateTrend(currentAvgScore, previousAvgScore),
      firstSessionConvertRate: currentConvertRate,
      firstSessionConvertRateTrend: calculateTrend(currentConvertRate, previousConvertRate),
      tutorChurnRiskCount,
      noShowRate: currentNoShowRate,
      noShowRateTrend: calculateTrend(currentNoShowRate, previousNoShowRate),
    };
  } catch (error) {
    console.error('Error fetching platform metrics:', error);
    throw new Error('Failed to fetch platform metrics');
  }
}

/**
 * Get top performing tutors ranked by overall score for dashboard
 * @param limit - Number of tutors to return (default: 10)
 * @returns Array of top performers with scores and session counts
 */
export async function getDashboardTopPerformers(limit: number = 10): Promise<TopPerformer[]> {
  if (limit <= 0) {
    throw new Error('Limit must be greater than 0');
  }

  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get tutors with their average scores and session counts from last 30 days
    const result = await db
      .select({
        user_id: sessions.tutor_id,
        name: users.name,
        overall_score: avg(sessions.overall_session_score),
        session_count: count(sessions.id),
      })
      .from(sessions)
      .innerJoin(users, eq(sessions.tutor_id, users.id))
      .where(
        and(
          gte(sessions.scheduled_start, thirtyDaysAgo),
          eq(sessions.status, 'completed')
        )
      )
      .groupBy(sessions.tutor_id, users.name)
      .orderBy(desc(avg(sessions.overall_session_score)))
      .limit(limit);

    return result.map((r) => ({
      user_id: r.user_id,
      name: r.name,
      overall_score: Number(r.overall_score ?? 0),
      session_count: Number(r.session_count ?? 0),
    }));
  } catch (error) {
    console.error('Error fetching top performers:', error);
    return [];
  }
}

/**
 * Get tutors needing attention (bottom performers by score)
 * @param limit - Number of tutors to return (default: 3)
 * @returns Array of bottom performing tutors with scores and alert counts
 */
export async function getTutorsNeedingAttention(limit: number = 3): Promise<TutorNeedingAttention[]> {
  if (limit <= 0) {
    throw new Error('Limit must be greater than 0');
  }

  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get tutors with their average scores AND churn risk indicators from last 30 days
    const tutorScores = await db
      .select({
        user_id: sessions.tutor_id,
        name: users.name,
        overall_score: avg(sessions.overall_session_score),
        no_show_count: sql<number>`COUNT(DISTINCT CASE WHEN ${sessions.status} = 'no_show_tutor' THEN ${sessions.id} END)`,
        reschedule_count: sql<number>`COUNT(DISTINCT CASE WHEN ${sessions.status} = 'rescheduled' AND ${sessions.rescheduled_by} = 'tutor' THEN ${sessions.id} END)`,
      })
      .from(sessions)
      .innerJoin(users, eq(sessions.tutor_id, users.id))
      .where(
        and(
          gte(sessions.scheduled_start, thirtyDaysAgo),
          eq(sessions.status, 'completed')
        )
      )
      .groupBy(sessions.tutor_id, users.name)
      .orderBy(avg(sessions.overall_session_score)) // Ascending order - lowest scores first
      .limit(limit);

    // Get active alert counts for the bottom performers
    const tutorIds = tutorScores.map(t => t.user_id);

    if (tutorIds.length === 0) {
      return [];
    }

    const alertCounts = await db
      .select({
        tutor_id: alerts.tutor_id,
        alert_count: count(alerts.id),
      })
      .from(alerts)
      .where(
        and(
          eq(alerts.acknowledged, false),
          eq(alerts.resolved, false),
          inArray(alerts.tutor_id, tutorIds)
        )
      )
      .groupBy(alerts.tutor_id);

    // Create a map for quick lookup
    const alertMap = new Map(
      alertCounts.map((a) => [
        a.tutor_id,
        Number(a.alert_count ?? 0),
      ])
    );

    return tutorScores.map((t) => {
      const noShows = Number(t.no_show_count || 0);
      const reschedules = Number(t.reschedule_count || 0);

      // Calculate churn risk level
      let churnRiskLevel: 'low' | 'medium' | 'high';
      if (noShows >= 2 || reschedules >= 4) {
        churnRiskLevel = 'high';
      } else if (noShows === 1 || reschedules >= 2) {
        churnRiskLevel = 'medium';
      } else {
        churnRiskLevel = 'low';
      }

      return {
        user_id: t.user_id,
        name: t.name,
        overall_score: Number(t.overall_score ?? 0),
        active_alert_count: alertMap.get(t.user_id) || 0,
        churn_risk_level: churnRiskLevel,
      };
    });
  } catch (error) {
    console.error('Error fetching tutors needing attention:', error);
    return [];
  }
}

/**
 * Get recent sessions with relevant details
 * @param limit - Number of sessions to return (default: 20)
 * @returns Array of recent sessions with scores, engagement, and metadata
 */
export async function getRecentSessions(limit: number = 20): Promise<RecentSession[]> {
  if (limit <= 0) {
    throw new Error('Limit must be greater than 0');
  }

  try {
    const result = await db
      .select({
        id: sessions.id,
        scheduled_start: sessions.scheduled_start,
        subject_name: subjects.name,
        tutor_name: users.name,
        overall_session_score: sessions.overall_session_score,
        student_engagement_score: sessionAudioMetrics.student_engagement_score,
        student_satisfaction_rating: sessionFeedback.student_satisfaction_rating,
      })
      .from(sessions)
      .innerJoin(users, eq(sessions.tutor_id, users.id))
      .innerJoin(subjects, eq(sessions.subject_id, subjects.id))
      .leftJoin(sessionAudioMetrics, eq(sessions.id, sessionAudioMetrics.session_id))
      .leftJoin(sessionFeedback, eq(sessions.id, sessionFeedback.session_id))
      .where(eq(sessions.status, 'completed'))
      .orderBy(desc(sessions.scheduled_start))
      .limit(limit);

    return result.map((r) => {
      const score = r.overall_session_score ? Number(r.overall_session_score) : null;
      const isFlagged = score !== null && score < 6.0;

      return {
        id: r.id,
        scheduled_start: r.scheduled_start,
        subject_name: r.subject_name,
        tutor_name: r.tutor_name,
        overall_session_score: score,
        student_engagement_score: r.student_engagement_score ? Number(r.student_engagement_score) : null,
        student_satisfaction_rating: r.student_satisfaction_rating || null,
        is_flagged: isFlagged,
      };
    });
  } catch (error) {
    console.error('Error fetching recent sessions:', error);
    return [];
  }
}
