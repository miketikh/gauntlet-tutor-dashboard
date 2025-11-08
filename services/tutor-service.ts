import { db } from '@/lib/db';
import { tutors, users, tutorSubjects, subjects, sessions, tutorPerformanceSnapshots, sessionAudioMetrics, sessionFeedback, alerts, tutorInsights, coachingNotes } from '@/lib/db';
import { eq, and, desc, count, gte, lte, sql, avg } from 'drizzle-orm';
import type { SnapshotPeriodTypeType } from '@/lib/db/types';
import { withCache, generateCacheKey, getCacheManager, CACHE_PREFIXES, CACHE_TTL } from '@/lib/cache';
import type { DateRange } from './platform-service';

// ============================================
// TYPESCRIPT INTERFACES
// ============================================

export interface TutorProfile {
  user_id: string;
  name: string;
  email: string;
  preferred_name: string | null;
  avatar_url: string | null;
  member_since: string;
  bio: string | null;
  experience: string | null;
  education: string | null;
  teaching_style: string | null;
  hourly_rate: string | null;
  subjects: Array<{
    id: string;
    name: string;
    category: string;
  }>;
}

export interface TutorSummary {
  user_id: string;
  name: string;
  email: string;
  member_since: string;
  bio: string | null;
  hourly_rate: string | null;
}

export interface TutorFilters {
  active_only?: boolean;
  subject_id?: string;
}

export interface TutorWithMetrics {
  user_id: string;
  name: string;
  email: string;
  member_since: string;
  bio: string | null;
  hourly_rate: string | null;
  overall_score: number | null;
  total_sessions: number;
  churn_risk_level: 'low' | 'medium' | 'high';
  no_show_count_30d: number;
  reschedule_count_30d: number;
}

export interface TutorDetailData {
  // User info
  user_id: string;
  name: string;
  email: string;
  preferred_name: string | null;
  avatar_url: string | null;
  role: string;

  // Tutor profile
  member_since: string;
  bio: string | null;
  subjects: Array<{
    id: string;
    name: string;
    category: string;
  }>;
  hourly_rate: string | null;

  // Calculated metrics
  overall_score: number | null;
  total_sessions: number;
  avg_student_rating: number | null;
  avg_student_engagement: number | null;
  rebook_rate: number | null;

  // Churn risk
  tutor_churn_risk: 'low' | 'medium' | 'high';
  no_show_count_30d: number;
  reschedule_count_30d: number;
  late_count_30d: number;

  // Rating divergence
  rating_score_divergence: number | null;
}

export interface TutorPerformanceTrend {
  date: string;
  sessionScore: number | null;
  engagement: number | null;
  satisfaction: number | null;
}

export interface TutorInsightData {
  id: string;
  insight_type: string;
  category: string;
  display_text: string;
  detected_at: Date;
  metric_value: string | null;
  sample_sessions: string[] | null;
}

export interface TutorAlertData {
  id: string;
  alert_type: string;
  severity: 'info' | 'warning' | 'critical';
  title: string;
  description: string;
  session_id: string | null;
  triggered_date: Date;
  acknowledged: boolean;
  resolved: boolean;
}

export interface CoachingNote {
  id: string;
  tutor_id: string;
  note_type: 'manual' | 'system';
  content: string;
  created_by: string | null;
  created_by_name: string | null;
  created_at: Date;
}

export interface SessionCountOptions {
  status?: string | string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
}

export interface PerformanceSnapshot {
  id: string;
  tutor_id: string;
  snapshot_date: string;
  period_type: SnapshotPeriodTypeType;
  sessions_count: number;
  avg_session_score: string | null;
  avg_engagement_score: string | null;
  avg_student_satisfaction: string | null;
  created_at: Date;
}

// PR 1.3: Student-Tutor Relationship Interfaces
export interface StudentTutorHistory {
  tutor_id: string;
  tutor_name: string;
  sessions_together: number;
  avg_session_score: number | null;
  avg_satisfaction_rating: number | null;
  first_session_date: Date;
  last_session_date: Date;
  rebook_rate: number | null;
}

export interface CurrentTutorInfo {
  tutor_id: string;
  tutor_name: string;
  session_count: number;
  last_session_date: Date;
}

// ============================================
// SERVICE FUNCTIONS
// ============================================

/**
 * Get a tutor's full profile with user info and subjects
 *
 * Fetches complete tutor information including user details, bio, rates,
 * and all subjects they teach.
 *
 * @param tutorId - The tutor user ID
 * @returns Tutor profile with user details and subjects taught, or null if not found
 *
 * @example
 * ```typescript
 * const tutor = await getTutorById('tutor-123');
 * if (tutor) {
 *   console.log(`${tutor.name} teaches ${tutor.subjects.length} subjects`);
 *   console.log(`Rate: ${tutor.hourly_rate}/hour`);
 * }
 * ```
 *
 * @note Requires junction table join through tutor_subjects
 * @note Performance: ~20-50ms depending on number of subjects
 */
export async function getTutorById(tutorId: string): Promise<TutorProfile | null> {
  try {
    // Fetch tutor with user info
    const tutorResult = await db
      .select({
        user_id: tutors.user_id,
        name: users.name,
        email: users.email,
        preferred_name: users.preferred_name,
        avatar_url: users.avatar_url,
        member_since: tutors.member_since,
        bio: tutors.bio,
        experience: tutors.experience,
        education: tutors.education,
        teaching_style: tutors.teaching_style,
        hourly_rate: tutors.hourly_rate,
      })
      .from(tutors)
      .innerJoin(users, eq(tutors.user_id, users.id))
      .where(eq(tutors.user_id, tutorId))
      .limit(1);

    if (tutorResult.length === 0) {
      return null;
    }

    // Fetch tutor's subjects
    const subjectsResult = await db
      .select({
        id: subjects.id,
        name: subjects.name,
        category: subjects.category,
      })
      .from(tutorSubjects)
      .innerJoin(subjects, eq(tutorSubjects.subject_id, subjects.id))
      .where(eq(tutorSubjects.tutor_id, tutorId));

    return {
      ...tutorResult[0],
      subjects: subjectsResult,
    };
  } catch (error) {
    console.error('Error in getTutorById:', error);
    throw new Error('Failed to fetch tutor profile: ' + (error as Error).message);
  }
}

/**
 * Get all tutors with optional filters
 *
 * Retrieves summaries of all tutors in the system with optional filtering
 * by subject. Ordered by member_since date descending (newest first).
 *
 * @param options - Optional filters for active status and subject
 * @param options.active_only - If true, only return active tutors (not yet implemented)
 * @param options.subject_id - Filter to tutors who teach a specific subject
 * @returns Array of tutor summaries
 *
 * @example
 * ```typescript
 * // Get all tutors
 * const allTutors = await getAllTutors();
 *
 * // Get tutors who teach math
 * const mathTutors = await getAllTutors({ subject_id: 'math-101' });
 * ```
 *
 * @note Currently all tutors in the table are considered active
 * @note Subject filter requires additional join through tutor_subjects
 */
export async function getAllTutors(options?: TutorFilters): Promise<TutorSummary[]> {
  try {
    let query = db
      .select({
        user_id: tutors.user_id,
        name: users.name,
        email: users.email,
        member_since: tutors.member_since,
        bio: tutors.bio,
        hourly_rate: tutors.hourly_rate,
      })
      .from(tutors)
      .innerJoin(users, eq(tutors.user_id, users.id));

    // Filter by subject if specified
    if (options?.subject_id) {
      query = query
        .innerJoin(tutorSubjects, eq(tutors.user_id, tutorSubjects.tutor_id))
        .where(eq(tutorSubjects.subject_id, options.subject_id)) as any;
    }

    // TODO: Add active_only filter when we have a status field
    // For now, all tutors in the table are considered active

    const results = await query.orderBy(desc(tutors.member_since));

    return results;
  } catch (error) {
    console.error('Error in getAllTutors:', error);
    throw new Error('Failed to fetch tutors: ' + (error as Error).message);
  }
}

/**
 * Get all tutors with calculated metrics in a single efficient query
 *
 * This function uses GROUP BY aggregations to calculate scores, session counts,
 * and churn risk indicators in one database query instead of N+1 queries.
 *
 * @param filters - Optional filters including churn risk levels to filter by
 * @returns Array of tutors with all metrics calculated
 *
 * @example
 * ```typescript
 * // Get all tutors with metrics
 * const tutors = await getAllTutorsWithMetrics();
 *
 * // Get only high and medium churn risk tutors
 * const atRiskTutors = await getAllTutorsWithMetrics({
 *   churnRisk: ['high', 'medium']
 * });
 * ```
 */
export async function getAllTutorsWithMetrics(filters?: {
  churnRisk?: string[]
}): Promise<TutorWithMetrics[]> {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Single efficient query with GROUP BY aggregations
    const results = await db
      .select({
        user_id: tutors.user_id,
        name: users.name,
        email: users.email,
        member_since: tutors.member_since,
        bio: tutors.bio,
        hourly_rate: tutors.hourly_rate,
        // Aggregate session metrics
        avg_score: avg(sessions.overall_session_score),
        total_sessions: sql<number>`COUNT(DISTINCT CASE WHEN ${sessions.status} = 'completed' THEN ${sessions.id} END)`,
        // Churn risk indicators (last 30 days)
        no_show_count_30d: sql<number>`COUNT(DISTINCT CASE WHEN ${sessions.status} = 'no_show_tutor' AND ${sessions.scheduled_start} >= ${thirtyDaysAgo.toISOString()} THEN ${sessions.id} END)`,
        reschedule_count_30d: sql<number>`COUNT(DISTINCT CASE WHEN ${sessions.status} = 'rescheduled' AND ${sessions.rescheduled_by} = 'tutor' AND ${sessions.scheduled_start} >= ${thirtyDaysAgo.toISOString()} THEN ${sessions.id} END)`,
      })
      .from(tutors)
      .innerJoin(users, eq(tutors.user_id, users.id))
      .leftJoin(sessions, eq(tutors.user_id, sessions.tutor_id))
      .groupBy(tutors.user_id, users.name, users.email, tutors.member_since, tutors.bio, tutors.hourly_rate)
      .orderBy(desc(tutors.member_since));

    // Calculate churn risk level and format results
    const tutorsWithMetrics: TutorWithMetrics[] = results.map((result) => {
      const noShows = Number(result.no_show_count_30d || 0);
      const reschedules = Number(result.reschedule_count_30d || 0);

      // Determine churn risk level based on thresholds
      let churnRiskLevel: 'low' | 'medium' | 'high';
      if (noShows >= 2 || reschedules >= 4) {
        churnRiskLevel = 'high';
      } else if (noShows === 1 || reschedules >= 2) {
        churnRiskLevel = 'medium';
      } else {
        churnRiskLevel = 'low';
      }

      return {
        user_id: result.user_id,
        name: result.name,
        email: result.email,
        member_since: result.member_since,
        bio: result.bio,
        hourly_rate: result.hourly_rate,
        overall_score: result.avg_score ? Number(result.avg_score) : null,
        total_sessions: Number(result.total_sessions || 0),
        churn_risk_level: churnRiskLevel,
        no_show_count_30d: noShows,
        reschedule_count_30d: reschedules,
      };
    });

    // Apply churn risk filter if specified
    if (filters?.churnRisk && filters.churnRisk.length > 0) {
      return tutorsWithMetrics.filter((tutor) =>
        filters.churnRisk!.includes(tutor.churn_risk_level)
      );
    }

    return tutorsWithMetrics;
  } catch (error) {
    console.error('Error in getAllTutorsWithMetrics:', error);
    throw new Error('Failed to fetch tutors with metrics: ' + (error as Error).message);
  }
}

/**
 * Get all subjects a tutor teaches
 *
 * Fetches the complete list of subjects this tutor is qualified to teach.
 *
 * @param tutorId - The tutor user ID
 * @returns Array of subject objects with id, name, and category
 *
 * @example
 * ```typescript
 * const subjects = await getTutorSubjects('tutor-123');
 * subjects.forEach(subject => {
 *   console.log(`${subject.name} (${subject.category})`);
 * });
 * ```
 *
 * @note Uses tutor_subjects junction table
 * @note Performance: Very fast, typically <10ms
 */
export async function getTutorSubjects(tutorId: string): Promise<Array<{
  id: string;
  name: string;
  category: string;
}>> {
  try {
    const result = await db
      .select({
        id: subjects.id,
        name: subjects.name,
        category: subjects.category,
      })
      .from(tutorSubjects)
      .innerJoin(subjects, eq(tutorSubjects.subject_id, subjects.id))
      .where(eq(tutorSubjects.tutor_id, tutorId));

    return result;
  } catch (error) {
    console.error('Error in getTutorSubjects:', error);
    throw new Error('Failed to fetch tutor subjects: ' + (error as Error).message);
  }
}

/**
 * Count sessions for a tutor with optional filters
 *
 * Returns the total number of sessions matching the given criteria.
 * Useful for pagination and statistics.
 *
 * @param tutorId - The tutor user ID
 * @param options - Optional filters for status and date range
 * @param options.status - Filter by session status (single value or array)
 * @param options.dateRange - Filter by date range (start and end)
 * @returns Number of sessions matching the criteria
 *
 * @example
 * ```typescript
 * // Count total completed sessions
 * const completedCount = await getTutorSessionCount('tutor-123', {
 *   status: 'completed'
 * });
 *
 * // Count sessions in last 30 days
 * const recentCount = await getTutorSessionCount('tutor-123', {
 *   dateRange: {
 *     start: thirtyDaysAgo,
 *     end: new Date()
 *   }
 * });
 * ```
 *
 * @note Very efficient - uses database COUNT aggregation
 * @note Performance: <10ms even with thousands of sessions
 */
export async function getTutorSessionCount(
  tutorId: string,
  options?: SessionCountOptions
): Promise<number> {
  try {
    const conditions = [eq(sessions.tutor_id, tutorId)];

    // Filter by status
    if (options?.status) {
      if (Array.isArray(options.status)) {
        conditions.push(sql`${sessions.status} = ANY(${options.status})`);
      } else {
        conditions.push(sql`${sessions.status} = ${options.status}`);
      }
    }

    // Filter by date range
    if (options?.dateRange) {
      conditions.push(gte(sessions.scheduled_start, options.dateRange.start));
      conditions.push(lte(sessions.scheduled_start, options.dateRange.end));
    }

    const result = await db
      .select({ count: count() })
      .from(sessions)
      .where(and(...conditions));

    return result[0]?.count || 0;
  } catch (error) {
    console.error('Error in getTutorSessionCount:', error);
    throw new Error('Failed to count tutor sessions: ' + (error as Error).message);
  }
}

/**
 * Get pre-aggregated performance snapshots for a tutor
 *
 * Fetches pre-calculated performance metrics grouped by time period.
 * These snapshots are generated by batch jobs and provide historical trends.
 *
 * @param tutorId - The tutor user ID
 * @param periodType - Type of period (daily/weekly), defaults to 'weekly'
 * @param days - Number of days to look back, defaults to 30
 * @returns Array of performance snapshots ordered by date descending (most recent first)
 *
 * @example
 * ```typescript
 * // Get weekly performance for last 30 days
 * const snapshots = await getTutorPerformanceSnapshots('tutor-123', 'weekly', 30);
 *
 * // Chart data
 * const chartData = snapshots.map(s => ({
 *   date: s.snapshot_date,
 *   score: parseFloat(s.avg_session_score || '0')
 * }));
 * ```
 *
 * @note Snapshots are pre-aggregated, making this very fast
 * @note Use for charting performance trends over time
 * @note Performance: <20ms regardless of total session count
 */
export async function getTutorPerformanceSnapshots(
  tutorId: string,
  periodType: SnapshotPeriodTypeType = 'weekly',
  days: number = 30
): Promise<PerformanceSnapshot[]> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const result = await db
      .select()
      .from(tutorPerformanceSnapshots)
      .where(
        and(
          eq(tutorPerformanceSnapshots.tutor_id, tutorId),
          eq(tutorPerformanceSnapshots.period_type, periodType),
          gte(tutorPerformanceSnapshots.snapshot_date, cutoffDate.toISOString().split('T')[0])
        )
      )
      .orderBy(desc(tutorPerformanceSnapshots.snapshot_date));

    return result;
  } catch (error) {
    console.error('Error in getTutorPerformanceSnapshots:', error);
    throw new Error('Failed to fetch tutor performance snapshots: ' + (error as Error).message);
  }
}

// ============================================
// CALCULATION FUNCTIONS
// ============================================

/**
 * Calculate tutor's overall score as weighted average of recent session scores
 * Recent sessions are weighted higher using exponential decay
 *
 * This function is cached for 15 minutes to improve performance on tutor detail pages.
 *
 * @param tutorId - The tutor user ID
 * @param dateRange - Optional date range, defaults to last 30 sessions
 * @returns Overall score (0-10) or null if no sessions
 */
export async function getTutorOverallScore(
  tutorId: string,
  dateRange?: DateRange
): Promise<number | null> {
  const cacheKey = generateCacheKey(CACHE_PREFIXES.TUTOR, {
    metric: 'overall_score',
    tutorId,
    start: dateRange?.start.toISOString(),
    end: dateRange?.end.toISOString(),
  });

  return withCache(cacheKey, CACHE_TTL.MEDIUM, async () => {
    try {
      // Build conditions based on whether date range is provided
      const conditions = [
        eq(sessions.tutor_id, tutorId),
        eq(sessions.status, 'completed')
      ];

      if (dateRange) {
        conditions.push(gte(sessions.scheduled_start, dateRange.start));
        conditions.push(lte(sessions.scheduled_start, dateRange.end));
      }

      let query = db
        .select({
          score: sessions.overall_session_score,
          date: sessions.scheduled_start,
        })
        .from(sessions)
        .where(and(...conditions))
        .orderBy(desc(sessions.scheduled_start));

      // Limit to last 30 sessions if no date range provided
      if (!dateRange) {
        query = query.limit(30) as any;
      }

      const sessionScores = await query;

      if (sessionScores.length === 0) {
        return null;
      }

      // Calculate weighted average with exponential decay
      // More recent sessions have higher weight
      let totalWeight = 0;
      let weightedSum = 0;
      const decayFactor = 0.95; // Each session back has 95% the weight of the previous

      sessionScores.forEach((session, index) => {
        const score = session.score ? Number(session.score) : 0;
        const weight = Math.pow(decayFactor, index);
        weightedSum += score * weight;
        totalWeight += weight;
      });

      return totalWeight > 0 ? weightedSum / totalWeight : null;
    } catch (error) {
      console.error('Error in getTutorOverallScore:', error);
      throw new Error('Failed to calculate tutor overall score: ' + (error as Error).message);
    }
  });
}

/**
 * Calculate tutor's rebook rate (percentage of completed sessions with follow-up booked)
 *
 * This function is cached for 15 minutes.
 *
 * @param tutorId - The tutor user ID
 * @param dateRange - Optional date range filter
 * @returns Rebook rate percentage (0-100) or null if no sessions
 */
export async function getTutorRebookRate(
  tutorId: string,
  dateRange?: DateRange
): Promise<number | null> {
  const cacheKey = generateCacheKey(CACHE_PREFIXES.TUTOR, {
    metric: 'rebook_rate',
    tutorId,
    start: dateRange?.start.toISOString(),
    end: dateRange?.end.toISOString(),
  });

  return withCache(cacheKey, CACHE_TTL.MEDIUM, async () => {
    try {
      const conditions = [
        eq(sessions.tutor_id, tutorId),
        eq(sessions.status, 'completed'),
      ];

      if (dateRange) {
        conditions.push(gte(sessions.scheduled_start, dateRange.start));
        conditions.push(lte(sessions.scheduled_start, dateRange.end));
      }

      const result = await db
        .select({
          total: count(sessions.id),
          rebooked: sql<number>`COUNT(CASE WHEN ${sessions.follow_up_booked} = true THEN 1 END)`,
        })
        .from(sessions)
        .where(and(...conditions));

      const total = Number(result[0]?.total || 0);
      if (total === 0) {
        return null;
      }

      const rebooked = Number(result[0]?.rebooked || 0);
      return (rebooked / total) * 100;
    } catch (error) {
      console.error('Error in getTutorRebookRate:', error);
      throw new Error('Failed to calculate tutor rebook rate: ' + (error as Error).message);
    }
  });
}

/**
 * Calculate tutor's first session convert rate
 * Percentage of first sessions (session_number=1) that lead to a second session
 *
 * This function is cached for 30 minutes since first session conversions change infrequently.
 *
 * @param tutorId - The tutor user ID
 * @returns Convert rate percentage (0-100) or null if no first sessions
 */
export async function getTutorFirstSessionConvertRate(tutorId: string): Promise<number | null> {
  const cacheKey = generateCacheKey(CACHE_PREFIXES.TUTOR, {
    metric: 'first_session_convert_rate',
    tutorId,
  });

  return withCache(cacheKey, CACHE_TTL.LONG, async () => {
    try {
      // Get all completed first sessions
      const firstSessions = await db
        .select({
          student_id: sessions.student_id,
        })
        .from(sessions)
        .where(
          and(
            eq(sessions.tutor_id, tutorId),
            eq(sessions.session_number, 1),
            eq(sessions.status, 'completed')
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
              eq(sessions.tutor_id, tutorId),
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
      console.error('Error in getTutorFirstSessionConvertRate:', error);
      throw new Error('Failed to calculate first session convert rate: ' + (error as Error).message);
    }
  });
}

/**
 * Calculate tutor's churn risk level based on no-shows, reschedules, and late arrivals
 *
 * This function is cached for 15 minutes.
 *
 * @param tutorId - The tutor user ID
 * @returns Risk level: 'low', 'medium', or 'high'
 */
export async function getTutorChurnRisk(tutorId: string): Promise<'low' | 'medium' | 'high'> {
  const cacheKey = generateCacheKey(CACHE_PREFIXES.TUTOR, {
    metric: 'churn_risk',
    tutorId,
  });

  return withCache(cacheKey, CACHE_TTL.MEDIUM, async () => {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Count no-shows in last 30 days
      const noShowResult = await db
        .select({ count: count() })
        .from(sessions)
        .where(
          and(
            eq(sessions.tutor_id, tutorId),
            sql`${sessions.status} IN ('no_show_tutor', 'no_show_student')`,
            gte(sessions.scheduled_start, thirtyDaysAgo)
          )
        );

      // Count reschedules in last 30 days
      const rescheduleResult = await db
        .select({ count: count() })
        .from(sessions)
        .where(
          and(
            eq(sessions.tutor_id, tutorId),
            eq(sessions.status, 'rescheduled'),
            gte(sessions.scheduled_start, thirtyDaysAgo)
          )
        );

      // Count late arrivals (actual_start > scheduled_start + 5 minutes)
      const lateResult = await db
        .select({ count: count() })
        .from(sessions)
        .where(
          and(
            eq(sessions.tutor_id, tutorId),
            eq(sessions.status, 'completed'),
            sql`${sessions.actual_start} > ${sessions.scheduled_start} + INTERVAL '5 minutes'`,
            gte(sessions.scheduled_start, thirtyDaysAgo)
          )
        );

      const noShows = Number(noShowResult[0]?.count || 0);
      const reschedules = Number(rescheduleResult[0]?.count || 0);
      const lateArrivals = Number(lateResult[0]?.count || 0);

      // Apply thresholds
      if (noShows >= 2 || reschedules >= 5) {
        return 'high';
      } else if (noShows === 1 || reschedules >= 3) {
        return 'medium';
      } else {
        return 'low';
      }
    } catch (error) {
      console.error('Error in getTutorChurnRisk:', error);
      throw new Error('Failed to calculate tutor churn risk: ' + (error as Error).message);
    }
  });
}

/**
 * Calculate average student engagement score from audio metrics
 *
 * This function is cached for 15 minutes.
 *
 * @param tutorId - The tutor user ID
 * @param dateRange - Optional date range filter
 * @returns Average engagement score (0-10) or null if no data
 */
export async function getTutorStudentEngagement(
  tutorId: string,
  dateRange?: DateRange
): Promise<number | null> {
  const cacheKey = generateCacheKey(CACHE_PREFIXES.TUTOR, {
    metric: 'student_engagement',
    tutorId,
    start: dateRange?.start.toISOString(),
    end: dateRange?.end.toISOString(),
  });

  return withCache(cacheKey, CACHE_TTL.MEDIUM, async () => {
    try {
      const conditions = [
        eq(sessions.tutor_id, tutorId),
        eq(sessions.status, 'completed'),
        eq(sessions.has_audio_analysis, true),
      ];

      if (dateRange) {
        conditions.push(gte(sessions.scheduled_start, dateRange.start));
        conditions.push(lte(sessions.scheduled_start, dateRange.end));
      }

      const result = await db
        .select({
          avg_engagement: sql<number>`AVG(CAST(${sql`sam.student_engagement_score`} AS DECIMAL))`,
        })
        .from(sessions)
        .innerJoin(
          sql`session_audio_metrics sam`,
          sql`${sessions.id} = sam.session_id`
        )
        .where(and(...conditions));

      return result[0]?.avg_engagement ? Number(result[0].avg_engagement) : null;
    } catch (error) {
      console.error('Error in getTutorStudentEngagement:', error);
      throw new Error('Failed to calculate tutor student engagement: ' + (error as Error).message);
    }
  });
}

/**
 * Calculate average student satisfaction rating from feedback
 *
 * This function is cached for 20 minutes since feedback comes in slowly.
 *
 * @param tutorId - The tutor user ID
 * @param dateRange - Optional date range filter
 * @returns Average rating (1-5) or null if no feedback
 */
export async function getTutorAvgStudentRating(
  tutorId: string,
  dateRange?: DateRange
): Promise<number | null> {
  const cacheKey = generateCacheKey(CACHE_PREFIXES.TUTOR, {
    metric: 'avg_student_rating',
    tutorId,
    start: dateRange?.start.toISOString(),
    end: dateRange?.end.toISOString(),
  });

  return withCache(cacheKey, 20 * 60, async () => {
    try {
      const conditions = [
        eq(sessions.tutor_id, tutorId),
        eq(sessions.status, 'completed'),
      ];

      if (dateRange) {
        conditions.push(gte(sessions.scheduled_start, dateRange.start));
        conditions.push(lte(sessions.scheduled_start, dateRange.end));
      }

      const result = await db
        .select({
          avg_rating: sql<number>`AVG(${sql`sf.student_satisfaction_rating`})`,
        })
        .from(sessions)
        .innerJoin(
          sql`session_feedback sf`,
          sql`${sessions.id} = sf.session_id`
        )
        .where(and(...conditions));

      return result[0]?.avg_rating ? Number(result[0].avg_rating) : null;
    } catch (error) {
      console.error('Error in getTutorAvgStudentRating:', error);
      throw new Error('Failed to calculate tutor average student rating: ' + (error as Error).message);
    }
  });
}

/**
 * Calculate rating-score divergence (difference between student rating and AI score)
 * Helps identify tutors where student perception differs from AI analysis
 * @param tutorId - The tutor user ID
 * @returns Divergence value or null if either metric is missing
 */
export async function getTutorRatingScoreDivergence(tutorId: string): Promise<number | null> {
  try {
    const avgRating = await getTutorAvgStudentRating(tutorId);
    const overallScore = await getTutorOverallScore(tutorId);

    if (avgRating === null || overallScore === null) {
      return null;
    }

    // Convert 1-5 rating to 0-10 scale and calculate absolute difference
    return Math.abs(avgRating * 2 - overallScore);
  } catch (error) {
    console.error('Error in getTutorRatingScoreDivergence:', error);
    throw new Error('Failed to calculate rating score divergence: ' + (error as Error).message);
  }
}

// ============================================
// CACHE INVALIDATION
// ============================================

/**
 * Invalidate all cache entries for a specific tutor
 *
 * Call this function when a tutor completes a new session or when their
 * metrics need to be recalculated.
 *
 * @param tutorId - The tutor user ID
 */
export function invalidateTutorCache(tutorId: string): void {
  const cache = getCacheManager();
  cache.deleteByPrefix(`${CACHE_PREFIXES.TUTOR}:.*:tutorId:${tutorId}`);
}

// ============================================
// TUTOR DETAIL PAGE FUNCTIONS
// ============================================

/**
 * Get complete tutor detail data for tutor detail page
 *
 * Fetches all data needed for the tutor detail page including profile,
 * calculated metrics, churn risk assessment, and rating divergence.
 *
 * @param tutorId - The tutor user ID
 * @returns Complete tutor detail data or null if tutor not found
 *
 * @example
 * ```typescript
 * const tutorDetail = await getTutorDetailById('tutor-123');
 * if (tutorDetail) {
 *   console.log(`${tutorDetail.name} - Score: ${tutorDetail.overall_score}`);
 *   console.log(`Churn risk: ${tutorDetail.tutor_churn_risk}`);
 * }
 * ```
 */
export async function getTutorDetailById(tutorId: string): Promise<TutorDetailData | null> {
  try {
    // Fetch base tutor profile
    const tutorProfile = await getTutorById(tutorId);
    if (!tutorProfile) {
      return null;
    }

    // Fetch user role
    const userResult = await db
      .select({ role: users.role })
      .from(users)
      .where(eq(users.id, tutorId))
      .limit(1);

    const role = userResult[0]?.role || 'tutor';

    // Calculate metrics in parallel
    const [
      overallScore,
      totalSessions,
      avgRating,
      avgEngagement,
      rebookRate,
      churnRiskData,
      ratingDivergence,
    ] = await Promise.all([
      getTutorOverallScore(tutorId),
      getTutorSessionCount(tutorId, { status: 'completed' }),
      getTutorAvgStudentRating(tutorId),
      getTutorStudentEngagement(tutorId),
      getTutorRebookRate(tutorId),
      calculateTutorChurnRiskData(tutorId),
      getTutorRatingScoreDivergence(tutorId),
    ]);

    return {
      user_id: tutorProfile.user_id,
      name: tutorProfile.name,
      email: tutorProfile.email,
      preferred_name: tutorProfile.preferred_name,
      avatar_url: tutorProfile.avatar_url,
      role,
      member_since: tutorProfile.member_since,
      bio: tutorProfile.bio,
      subjects: tutorProfile.subjects,
      hourly_rate: tutorProfile.hourly_rate,
      overall_score: overallScore,
      total_sessions: totalSessions,
      avg_student_rating: avgRating,
      avg_student_engagement: avgEngagement,
      rebook_rate: rebookRate,
      tutor_churn_risk: churnRiskData.risk_level,
      no_show_count_30d: churnRiskData.no_show_count,
      reschedule_count_30d: churnRiskData.reschedule_count,
      late_count_30d: churnRiskData.late_count,
      rating_score_divergence: ratingDivergence,
    };
  } catch (error) {
    console.error('Error in getTutorDetailById:', error);
    throw new Error('Failed to fetch tutor detail: ' + (error as Error).message);
  }
}

/**
 * Helper function to calculate tutor churn risk data
 * Returns risk level and counts for no-shows, reschedules, and late arrivals
 */
async function calculateTutorChurnRiskData(tutorId: string): Promise<{
  risk_level: 'low' | 'medium' | 'high';
  no_show_count: number;
  reschedule_count: number;
  late_count: number;
}> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Count no-shows in last 30 days
  const noShowResult = await db
    .select({ count: count() })
    .from(sessions)
    .where(
      and(
        eq(sessions.tutor_id, tutorId),
        eq(sessions.status, 'no_show_tutor'),
        gte(sessions.scheduled_start, thirtyDaysAgo)
      )
    );

  // Count reschedules in last 30 days (tutor-initiated)
  const rescheduleResult = await db
    .select({ count: count() })
    .from(sessions)
    .where(
      and(
        eq(sessions.tutor_id, tutorId),
        eq(sessions.status, 'rescheduled'),
        eq(sessions.rescheduled_by, 'tutor'),
        gte(sessions.scheduled_start, thirtyDaysAgo)
      )
    );

  // Count late arrivals (actual_start > scheduled_start + 5 minutes)
  const lateResult = await db
    .select({ count: count() })
    .from(sessions)
    .where(
      and(
        eq(sessions.tutor_id, tutorId),
        eq(sessions.status, 'completed'),
        sql`${sessions.actual_start} > ${sessions.scheduled_start} + INTERVAL '5 minutes'`,
        gte(sessions.scheduled_start, thirtyDaysAgo)
      )
    );

  const noShows = Number(noShowResult[0]?.count || 0);
  const reschedules = Number(rescheduleResult[0]?.count || 0);
  const lateArrivals = Number(lateResult[0]?.count || 0);

  // Apply thresholds to determine risk level
  let riskLevel: 'low' | 'medium' | 'high';

  if (noShows >= 2 || reschedules >= 4) {
    riskLevel = 'high';
  } else if (noShows === 1 || reschedules >= 2) {
    riskLevel = 'medium';
  } else {
    riskLevel = 'low';
  }

  return {
    risk_level: riskLevel,
    no_show_count: noShows,
    reschedule_count: reschedules,
    late_count: lateArrivals,
  };
}

/**
 * Get tutor performance trends over a specified number of days
 *
 * Returns daily aggregates of session scores, engagement, and satisfaction.
 * Uses tutor_performance_snapshots if available for efficiency, otherwise
 * calculates from sessions in real-time.
 *
 * @param tutorId - The tutor user ID
 * @param days - Number of days to look back (default: 30)
 * @returns Array of performance trends ordered by date ascending
 *
 * @example
 * ```typescript
 * const trends = await getTutorPerformanceTrends('tutor-123', 30);
 * trends.forEach(trend => {
 *   console.log(`${trend.date}: Score ${trend.sessionScore}`);
 * });
 * ```
 */
export async function getTutorPerformanceTrends(
  tutorId: string,
  days: number = 30
): Promise<TutorPerformanceTrend[]> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    // Try to use pre-aggregated snapshots first
    const snapshots = await db
      .select()
      .from(tutorPerformanceSnapshots)
      .where(
        and(
          eq(tutorPerformanceSnapshots.tutor_id, tutorId),
          eq(tutorPerformanceSnapshots.period_type, 'daily'),
          gte(tutorPerformanceSnapshots.snapshot_date, cutoffDate.toISOString().split('T')[0])
        )
      )
      .orderBy(tutorPerformanceSnapshots.snapshot_date);

    if (snapshots.length > 0) {
      // Use snapshots data
      return snapshots.map(snapshot => ({
        date: snapshot.snapshot_date,
        sessionScore: snapshot.avg_session_score ? Number(parseFloat(snapshot.avg_session_score).toFixed(2)) : null,
        engagement: snapshot.avg_engagement_score ? Number(parseFloat(snapshot.avg_engagement_score).toFixed(2)) : null,
        satisfaction: snapshot.avg_student_satisfaction ? Number(parseFloat(snapshot.avg_student_satisfaction).toFixed(2)) : null,
      }));
    }

    // Fallback: Calculate from sessions
    const sessionsData = await db
      .select({
        date: sql<string>`DATE(${sessions.scheduled_start})`,
        avg_score: sql<number>`AVG(CAST(${sessions.overall_session_score} AS DECIMAL))`,
        avg_engagement: sql<number>`AVG(CAST(${sessionAudioMetrics.student_engagement_score} AS DECIMAL))`,
        avg_satisfaction: sql<number>`AVG(${sessionFeedback.student_satisfaction_rating})`,
      })
      .from(sessions)
      .leftJoin(sessionAudioMetrics, eq(sessions.id, sessionAudioMetrics.session_id))
      .leftJoin(sessionFeedback, eq(sessions.id, sessionFeedback.session_id))
      .where(
        and(
          eq(sessions.tutor_id, tutorId),
          eq(sessions.status, 'completed'),
          gte(sessions.scheduled_start, cutoffDate)
        )
      )
      .groupBy(sql`DATE(${sessions.scheduled_start})`)
      .orderBy(sql`DATE(${sessions.scheduled_start})`);

    return sessionsData.map(data => ({
      date: data.date,
      sessionScore: data.avg_score ? Number(Number(data.avg_score).toFixed(2)) : null,
      engagement: data.avg_engagement ? Number(Number(data.avg_engagement).toFixed(2)) : null,
      // Convert 1-5 rating to 0-10 scale
      satisfaction: data.avg_satisfaction ? Number((Number(data.avg_satisfaction) * 2).toFixed(2)) : null,
    }));
  } catch (error) {
    console.error('Error in getTutorPerformanceTrends:', error);
    throw new Error('Failed to fetch tutor performance trends: ' + (error as Error).message);
  }
}

/**
 * Get tutor insights (strengths and growth opportunities)
 *
 * Returns active insights from the tutor_insights table, separated by type.
 *
 * @param tutorId - The tutor user ID
 * @returns Object containing strengths and growth opportunities arrays
 *
 * @example
 * ```typescript
 * const insights = await getTutorInsights('tutor-123');
 * console.log(`Strengths: ${insights.strengths.length}`);
 * console.log(`Growth areas: ${insights.growth_opportunities.length}`);
 * ```
 */
export async function getTutorInsightsData(tutorId: string): Promise<{
  strengths: TutorInsightData[];
  growth_opportunities: TutorInsightData[];
}> {
  try {
    const allInsights = await db
      .select()
      .from(tutorInsights)
      .where(
        and(
          eq(tutorInsights.tutor_id, tutorId),
          eq(tutorInsights.is_active, true)
        )
      )
      .orderBy(desc(tutorInsights.detected_at));

    const strengths = allInsights
      .filter(insight => insight.insight_type === 'strength')
      .map(insight => ({
        id: insight.id,
        insight_type: insight.insight_type,
        category: insight.category,
        display_text: insight.display_text,
        detected_at: new Date(insight.detected_at),
        metric_value: insight.metric_value,
        sample_sessions: insight.sample_sessions,
      }));

    const growthOpportunities = allInsights
      .filter(insight => insight.insight_type === 'growth_area')
      .map(insight => ({
        id: insight.id,
        insight_type: insight.insight_type,
        category: insight.category,
        display_text: insight.display_text,
        detected_at: new Date(insight.detected_at),
        metric_value: insight.metric_value,
        sample_sessions: insight.sample_sessions,
      }));

    return {
      strengths,
      growth_opportunities: growthOpportunities,
    };
  } catch (error) {
    console.error('Error in getTutorInsightsData:', error);
    throw new Error('Failed to fetch tutor insights: ' + (error as Error).message);
  }
}

/**
 * Get tutor alerts (active or including resolved)
 *
 * Returns alerts from the alerts table with optional filtering for resolved alerts.
 *
 * @param tutorId - The tutor user ID
 * @param includeResolved - Whether to include resolved alerts (default: false)
 * @returns Array of alerts ordered by severity then triggered date
 *
 * @example
 * ```typescript
 * // Get only active alerts
 * const activeAlerts = await getTutorAlertsData('tutor-123');
 *
 * // Get all alerts including resolved
 * const allAlerts = await getTutorAlertsData('tutor-123', true);
 * ```
 */
export async function getTutorAlertsData(
  tutorId: string,
  includeResolved: boolean = false
): Promise<TutorAlertData[]> {
  try {
    const conditions = [eq(alerts.tutor_id, tutorId)];

    if (!includeResolved) {
      conditions.push(eq(alerts.resolved, false));
    }

    const alertsResult = await db
      .select({
        id: alerts.id,
        alert_type: alerts.alert_type,
        severity: alerts.severity,
        title: alerts.title,
        description: alerts.description,
        session_id: alerts.session_id,
        triggered_date: alerts.triggered_date,
        acknowledged: alerts.acknowledged,
        resolved: alerts.resolved,
      })
      .from(alerts)
      .where(and(...conditions))
      .orderBy(
        sql`CASE
          WHEN ${alerts.severity} = 'critical' THEN 1
          WHEN ${alerts.severity} = 'warning' THEN 2
          WHEN ${alerts.severity} = 'info' THEN 3
          ELSE 4
        END`,
        desc(alerts.triggered_date)
      );

    return alertsResult.map(alert => ({
      ...alert,
      triggered_date: new Date(alert.triggered_date),
    }));
  } catch (error) {
    console.error('Error in getTutorAlertsData:', error);
    throw new Error('Failed to fetch tutor alerts: ' + (error as Error).message);
  }
}

// ============================================
// PR 1.3: STUDENT-TUTOR RELATIONSHIP FUNCTIONS
// ============================================

/**
 * Get detailed tutor history for a student
 *
 * For each tutor a student has worked with, calculates per-tutor performance metrics
 * including session scores, satisfaction ratings, and rebook rates. This helps identify
 * tutor compatibility issues and successful tutor-student pairings.
 *
 * @param studentId - The student user ID
 * @returns Array of tutor history with per-tutor metrics, ordered chronologically
 *
 * @example
 * ```typescript
 * const tutorHistory = await getStudentTutorHistory('student-123');
 * const bestMatch = tutorHistory.reduce((best, curr) =>
 *   (curr.avg_session_score || 0) > (best.avg_session_score || 0) ? curr : best
 * );
 * console.log(`Best tutor match: ${bestMatch.tutor_name}`);
 * ```
 */
export async function getStudentTutorHistory(studentId: string): Promise<StudentTutorHistory[]> {
  try {
    const result = await db
      .select({
        tutor_id: sessions.tutor_id,
        tutor_name: users.name,
        sessions_together: count(sessions.id),
        avg_session_score: avg(sessions.overall_session_score),
        avg_satisfaction_rating: avg(sessionFeedback.student_satisfaction_rating),
        first_session_date: sql<Date>`MIN(${sessions.scheduled_start})`,
        last_session_date: sql<Date>`MAX(${sessions.scheduled_start})`,
        total_sessions: count(sessions.id),
        booked_follow_ups: sql<number>`COUNT(CASE WHEN ${sessions.follow_up_booked} = true THEN 1 END)`,
      })
      .from(sessions)
      .innerJoin(users, eq(sessions.tutor_id, users.id))
      .leftJoin(sessionFeedback, eq(sessions.id, sessionFeedback.session_id))
      .where(
        and(
          eq(sessions.student_id, studentId),
          eq(sessions.status, 'completed')
        )
      )
      .groupBy(sessions.tutor_id, users.name)
      .orderBy(sql`MIN(${sessions.scheduled_start})`);

    return result.map(r => {
      const totalSessions = Number(r.sessions_together);
      const bookedFollowUps = Number(r.booked_follow_ups);

      return {
        tutor_id: r.tutor_id,
        tutor_name: r.tutor_name,
        sessions_together: totalSessions,
        avg_session_score: r.avg_session_score ? Number(r.avg_session_score) : null,
        avg_satisfaction_rating: r.avg_satisfaction_rating ? Number(r.avg_satisfaction_rating) : null,
        first_session_date: r.first_session_date,
        last_session_date: r.last_session_date,
        rebook_rate: totalSessions > 0 ? (bookedFollowUps / totalSessions) * 100 : null,
      };
    });
  } catch (error) {
    console.error('Error in getStudentTutorHistory:', error);
    throw new Error('Failed to fetch student tutor history: ' + (error as Error).message);
  }
}

/**
 * Get current tutor for a student
 *
 * Identifies the most recent tutor a student worked with, which is useful for
 * highlighting the current tutor relationship in the UI.
 *
 * @param studentId - The student user ID
 * @returns Current tutor information or null if no sessions found
 *
 * @example
 * ```typescript
 * const currentTutor = await getStudentCurrentTutor('student-123');
 * if (currentTutor) {
 *   console.log(`Currently working with: ${currentTutor.tutor_name}`);
 * }
 * ```
 */
export async function getStudentCurrentTutor(studentId: string): Promise<CurrentTutorInfo | null> {
  try {
    const result = await db
      .select({
        tutor_id: sessions.tutor_id,
        tutor_name: users.name,
        session_count: count(sessions.id),
        last_session_date: sql<Date>`MAX(${sessions.scheduled_start})`,
      })
      .from(sessions)
      .innerJoin(users, eq(sessions.tutor_id, users.id))
      .where(eq(sessions.student_id, studentId))
      .groupBy(sessions.tutor_id, users.name)
      .orderBy(desc(sql`MAX(${sessions.scheduled_start})`))
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    return {
      tutor_id: result[0].tutor_id,
      tutor_name: result[0].tutor_name,
      session_count: Number(result[0].session_count),
      last_session_date: result[0].last_session_date,
    };
  } catch (error) {
    console.error('Error in getStudentCurrentTutor:', error);
    throw new Error('Failed to fetch student current tutor: ' + (error as Error).message);
  }
}

/**
 * Get coaching notes for a tutor
 *
 * Returns all coaching notes (both manual and system-generated) for a tutor,
 * ordered by created date descending (most recent first).
 *
 * @param tutorId - The tutor user ID
 * @returns Array of coaching notes with author information
 *
 * @example
 * ```typescript
 * const notes = await getCoachingNotes('tutor-123');
 * notes.forEach(note => {
 *   console.log(`${note.note_type}: ${note.content}`);
 * });
 * ```
 */
export async function getCoachingNotes(tutorId: string): Promise<CoachingNote[]> {
  try {
    const result = await db
      .select({
        id: coachingNotes.id,
        tutor_id: coachingNotes.tutor_id,
        note_type: coachingNotes.note_type,
        content: coachingNotes.content,
        created_by: coachingNotes.created_by,
        created_by_name: users.name,
        created_at: coachingNotes.created_at,
      })
      .from(coachingNotes)
      .leftJoin(users, eq(coachingNotes.created_by, users.id))
      .where(eq(coachingNotes.tutor_id, tutorId))
      .orderBy(desc(coachingNotes.created_at));

    return result.map(note => ({
      ...note,
      created_at: new Date(note.created_at),
    }));
  } catch (error) {
    console.error('Error in getCoachingNotes:', error);
    throw new Error('Failed to fetch coaching notes: ' + (error as Error).message);
  }
}

/**
 * Calculate tutor compatibility score for a student-tutor pair
 *
 * Computes a 0-10 compatibility score based on session scores, engagement,
 * rebook rate, and satisfaction ratings. Used to identify good/bad tutor matches.
 *
 * @param studentId - The student user ID
 * @param tutorId - The tutor user ID
 * @returns Compatibility score 0-10 (higher is better)
 *
 * @example
 * ```typescript
 * const compatibility = await getTutorCompatibilityScore('student-123', 'tutor-456');
 * if (compatibility < 6.0) {
 *   console.log('Poor tutor match - consider switching');
 * }
 * ```
 */
export async function getTutorCompatibilityScore(
  studentId: string,
  tutorId: string
): Promise<number> {
  try {
    const metrics = await db
      .select({
        avg_session_score: avg(sessions.overall_session_score),
        avg_engagement: avg(sessionAudioMetrics.student_engagement_score),
        avg_satisfaction: avg(sessionFeedback.student_satisfaction_rating),
        total_sessions: count(sessions.id),
        booked_follow_ups: sql<number>`COUNT(CASE WHEN ${sessions.follow_up_booked} = true THEN 1 END)`,
      })
      .from(sessions)
      .leftJoin(sessionAudioMetrics, eq(sessions.id, sessionAudioMetrics.session_id))
      .leftJoin(sessionFeedback, eq(sessions.id, sessionFeedback.session_id))
      .where(
        and(
          eq(sessions.student_id, studentId),
          eq(sessions.tutor_id, tutorId),
          eq(sessions.status, 'completed')
        )
      );

    if (metrics.length === 0 || Number(metrics[0].total_sessions) === 0) {
      return 5.0; // No data = neutral score
    }

    const totalSessions = Number(metrics[0].total_sessions);
    const bookedFollowUps = Number(metrics[0].booked_follow_ups);

    // Calculate individual components (all normalized to 0-10)
    const sessionScore = metrics[0].avg_session_score ? Number(metrics[0].avg_session_score) : 5.0;
    const engagementScore = metrics[0].avg_engagement ? Number(metrics[0].avg_engagement) : 5.0;
    const satisfactionScore = metrics[0].avg_satisfaction
      ? (Number(metrics[0].avg_satisfaction) / 5) * 10 // Normalize 1-5 to 0-10
      : 5.0;
    const rebookScore = totalSessions > 0 ? (bookedFollowUps / totalSessions) * 10 : 5.0;

    // Weighted average
    const compatibilityScore =
      sessionScore * 0.35 +
      engagementScore * 0.25 +
      satisfactionScore * 0.25 +
      rebookScore * 0.15;

    return Math.round(compatibilityScore * 10) / 10; // Round to 1 decimal
  } catch (error) {
    console.error('Error in getTutorCompatibilityScore:', error);
    throw new Error('Failed to calculate tutor compatibility score: ' + (error as Error).message);
  }
}
