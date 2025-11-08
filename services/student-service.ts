import { db } from '@/lib/db';
import { students, users, studentSubjects, subjects, studentChurnReasons, sessions, churnAlgorithmWeights } from '@/lib/db';
import { eq, and, desc, count, sql, avg, gte, lte } from 'drizzle-orm';
import type { StudentStatusType, ChurnReasonType, ChurnFactor, ChurnFactorCategoryType } from '@/lib/db/types';
import { withCache, generateCacheKey, getCacheManager, CACHE_PREFIXES } from '@/lib/cache';

// ============================================
// TYPESCRIPT INTERFACES
// ============================================

export interface StudentProfile {
  user_id: string;
  name: string;
  email: string;
  preferred_name: string | null;
  avatar_url: string | null;
  enrolled_since: string;
  grade_level: string | null;
  parent_email: string | null;
  bio: string | null;
  learning_goals: string | null;
  status: StudentStatusType;
  churned_date: string | null;
  churn_survey_response: string | null;
  subjects: Array<{
    id: string;
    name: string;
    category: string;
  }>;
  churn_reasons: ChurnReasonType[];
}

export interface StudentSummary {
  user_id: string;
  name: string;
  email: string;
  enrolled_since: string;
  grade_level: string | null;
  status: StudentStatusType;
}

export interface StudentFilters {
  status?: StudentStatusType;
  grade_level?: string;
}

export interface SessionCountOptions {
  status?: string | string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
}

export interface TutorHistory {
  tutor_id: string;
  tutor_name: string;
  session_count: number;
  first_session_date: Date;
  last_session_date: Date;
}

// PR 1.1: New interfaces for Student Detail Page
export interface StudentDetailProfile {
  user_id: string;
  name: string;
  email: string;
  preferred_name: string | null;
  avatar_url: string | null;
  enrolled_since: string;
  grade_level: string | null;
  parent_email: string | null;
  bio: string | null;
  learning_goals: string | null;
  status: StudentStatusType;
  churned_date: string | null;
  churn_survey_response: string | null;
  subjects: Array<{
    id: string;
    name: string;
    category: string;
  }>;
}

export interface StudentStats {
  sessions_completed: number;
  avg_session_score: number | null;
  avg_engagement: number | null;
  avg_satisfaction_rating: number | null;
  rebook_rate: number | null;
  tutors_worked_with: number;
}

export interface StudentSessionSummary {
  first_session_date: Date | null;
  last_session_date: Date | null;
  total_sessions: number;
  completed_sessions: number;
  no_show_sessions: number;
  cancelled_sessions: number;
  rescheduled_sessions: number;
}

// ============================================
// SERVICE FUNCTIONS
// ============================================

/**
 * Get a student's full profile with user info, subjects, and churn reasons
 * @param studentId - The student user ID
 * @returns Student profile with all related information
 */
export async function getStudentById(studentId: string): Promise<StudentProfile | null> {
  try {
    // Fetch student with user info
    const studentResult = await db
      .select({
        user_id: students.user_id,
        name: users.name,
        email: users.email,
        preferred_name: users.preferred_name,
        avatar_url: users.avatar_url,
        enrolled_since: students.enrolled_since,
        grade_level: students.grade_level,
        parent_email: students.parent_email,
        bio: students.bio,
        learning_goals: students.learning_goals,
        status: students.status,
        churned_date: students.churned_date,
        churn_survey_response: students.churn_survey_response,
      })
      .from(students)
      .innerJoin(users, eq(students.user_id, users.id))
      .where(eq(students.user_id, studentId))
      .limit(1);

    if (studentResult.length === 0) {
      return null;
    }

    const student = studentResult[0];

    // Fetch student's subjects
    const subjectsResult = await db
      .select({
        id: subjects.id,
        name: subjects.name,
        category: subjects.category,
      })
      .from(studentSubjects)
      .innerJoin(subjects, eq(studentSubjects.subject_id, subjects.id))
      .where(eq(studentSubjects.student_id, studentId));

    // Fetch churn reasons if student is churned
    let churnReasonsArray: ChurnReasonType[] = [];
    if (student.status === 'churned') {
      const churnReasonsResult = await db
        .select({
          reason: studentChurnReasons.reason,
        })
        .from(studentChurnReasons)
        .where(eq(studentChurnReasons.student_id, studentId));

      churnReasonsArray = churnReasonsResult.map(r => r.reason);
    }

    return {
      ...student,
      subjects: subjectsResult,
      churn_reasons: churnReasonsArray,
    };
  } catch (error) {
    console.error('Error in getStudentById:', error);
    throw new Error('Failed to fetch student profile: ' + (error as Error).message);
  }
}

/**
 * Get all students with optional filters
 * @param options - Optional filters for status and grade level
 * @returns Array of student summaries
 */
export async function getAllStudents(options?: StudentFilters): Promise<StudentSummary[]> {
  try {
    const conditions = [];

    // Filter by status
    if (options?.status) {
      conditions.push(eq(students.status, options.status));
    }

    // Filter by grade level
    if (options?.grade_level) {
      conditions.push(sql`${students.grade_level} = ${options.grade_level}`);
    }

    const query = db
      .select({
        user_id: students.user_id,
        name: users.name,
        email: users.email,
        enrolled_since: students.enrolled_since,
        grade_level: students.grade_level,
        status: students.status,
      })
      .from(students)
      .innerJoin(users, eq(students.user_id, users.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(students.enrolled_since));

    return await query;
  } catch (error) {
    console.error('Error in getAllStudents:', error);
    throw new Error('Failed to fetch students: ' + (error as Error).message);
  }
}

/**
 * Get churn reasons for a specific student
 * @param studentId - The student user ID
 * @returns Array of churn reasons
 */
export async function getStudentChurnReasons(studentId: string): Promise<ChurnReasonType[]> {
  try {
    const result = await db
      .select({
        reason: studentChurnReasons.reason,
      })
      .from(studentChurnReasons)
      .where(eq(studentChurnReasons.student_id, studentId))
      .orderBy(desc(studentChurnReasons.added_at));

    return result.map(r => r.reason);
  } catch (error) {
    console.error('Error in getStudentChurnReasons:', error);
    throw new Error('Failed to fetch student churn reasons: ' + (error as Error).message);
  }
}

/**
 * Get tutor history for a student (all tutors they've worked with)
 * @param studentId - The student user ID
 * @returns Array of tutors with session counts and date ranges
 */
export async function getStudentTutorHistory(studentId: string): Promise<TutorHistory[]> {
  try {
    const result = await db
      .select({
        tutor_id: sessions.tutor_id,
        tutor_name: users.name,
        session_count: count(sessions.id),
        first_session_date: sql<Date>`MIN(${sessions.scheduled_start})`,
        last_session_date: sql<Date>`MAX(${sessions.scheduled_start})`,
      })
      .from(sessions)
      .innerJoin(users, eq(sessions.tutor_id, users.id))
      .where(eq(sessions.student_id, studentId))
      .groupBy(sessions.tutor_id, users.name)
      .orderBy(desc(sql`MAX(${sessions.scheduled_start})`));

    return result.map(r => ({
      tutor_id: r.tutor_id,
      tutor_name: r.tutor_name,
      session_count: Number(r.session_count),
      first_session_date: r.first_session_date,
      last_session_date: r.last_session_date,
    }));
  } catch (error) {
    console.error('Error in getStudentTutorHistory:', error);
    throw new Error('Failed to fetch student tutor history: ' + (error as Error).message);
  }
}

/**
 * Count sessions for a student with optional filters
 * @param studentId - The student user ID
 * @param options - Optional filters for status and date range
 * @returns Number of sessions matching the criteria
 */
export async function getStudentSessionCount(
  studentId: string,
  options?: SessionCountOptions
): Promise<number> {
  try {
    const conditions = [eq(sessions.student_id, studentId)];

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
      conditions.push(sql`${sessions.scheduled_start} >= ${options.dateRange.start}`);
      conditions.push(sql`${sessions.scheduled_start} <= ${options.dateRange.end}`);
    }

    const result = await db
      .select({ count: count() })
      .from(sessions)
      .where(and(...conditions));

    return result[0]?.count || 0;
  } catch (error) {
    console.error('Error in getStudentSessionCount:', error);
    throw new Error('Failed to count student sessions: ' + (error as Error).message);
  }
}

// ============================================
// PR 1.1: STUDENT DETAIL SERVICE FUNCTIONS
// ============================================

/**
 * Get a student's detailed profile for the Student Detail Page
 * Similar to getStudentById but specifically tailored for detail page needs
 *
 * @param studentId - The student user ID
 * @returns Detailed student profile with user info and subjects
 */
export async function getStudentDetailById(studentId: string): Promise<StudentDetailProfile | null> {
  try {
    // Fetch student with user info
    const studentResult = await db
      .select({
        user_id: students.user_id,
        name: users.name,
        email: users.email,
        preferred_name: users.preferred_name,
        avatar_url: users.avatar_url,
        enrolled_since: students.enrolled_since,
        grade_level: students.grade_level,
        parent_email: students.parent_email,
        bio: students.bio,
        learning_goals: students.learning_goals,
        status: students.status,
        churned_date: students.churned_date,
        churn_survey_response: students.churn_survey_response,
      })
      .from(students)
      .innerJoin(users, eq(students.user_id, users.id))
      .where(eq(students.user_id, studentId))
      .limit(1);

    if (studentResult.length === 0) {
      return null;
    }

    const student = studentResult[0];

    // Fetch student's subjects
    const subjectsResult = await db
      .select({
        id: subjects.id,
        name: subjects.name,
        category: subjects.category,
      })
      .from(studentSubjects)
      .innerJoin(subjects, eq(studentSubjects.subject_id, subjects.id))
      .where(eq(studentSubjects.student_id, studentId));

    return {
      ...student,
      subjects: subjectsResult,
    };
  } catch (error) {
    console.error('Error in getStudentDetailById:', error);
    throw new Error('Failed to fetch student detail profile: ' + (error as Error).message);
  }
}

/**
 * Get calculated statistics for a student
 * Includes session counts, averages, and engagement metrics
 *
 * @param studentId - The student user ID
 * @returns Student statistics object with calculated metrics
 */
export async function getStudentStats(studentId: string): Promise<StudentStats> {
  try {
    // Import sessionAudioMetrics from db
    const { sessionAudioMetrics, sessionFeedback } = await import('@/lib/db');

    // Count completed sessions
    const completedSessionsResult = await db
      .select({
        count: count(),
      })
      .from(sessions)
      .where(
        and(
          eq(sessions.student_id, studentId),
          eq(sessions.status, 'completed')
        )
      );

    const sessions_completed = Number(completedSessionsResult[0]?.count || 0);

    // If no completed sessions, return zeros/nulls
    if (sessions_completed === 0) {
      return {
        sessions_completed: 0,
        avg_session_score: null,
        avg_engagement: null,
        avg_satisfaction_rating: null,
        rebook_rate: null,
        tutors_worked_with: 0,
      };
    }

    // Calculate avg session score
    const avgScoreResult = await db
      .select({
        avg: avg(sessions.overall_session_score),
      })
      .from(sessions)
      .where(
        and(
          eq(sessions.student_id, studentId),
          eq(sessions.status, 'completed'),
          sql`${sessions.overall_session_score} IS NOT NULL`
        )
      );

    const avg_session_score = avgScoreResult[0]?.avg
      ? Number(avgScoreResult[0].avg)
      : null;

    // Calculate avg engagement from audio metrics
    const avgEngagementResult = await db
      .select({
        avg: avg(sessionAudioMetrics.student_engagement_score),
      })
      .from(sessions)
      .innerJoin(sessionAudioMetrics, eq(sessions.id, sessionAudioMetrics.session_id))
      .where(
        and(
          eq(sessions.student_id, studentId),
          eq(sessions.status, 'completed'),
          eq(sessions.has_audio_analysis, true)
        )
      );

    const avg_engagement = avgEngagementResult[0]?.avg
      ? Number(avgEngagementResult[0].avg)
      : null;

    // Calculate avg satisfaction rating from feedback (exclude NULL)
    const avgSatisfactionResult = await db
      .select({
        avg: avg(sessionFeedback.student_satisfaction_rating),
      })
      .from(sessions)
      .innerJoin(sessionFeedback, eq(sessions.id, sessionFeedback.session_id))
      .where(
        and(
          eq(sessions.student_id, studentId),
          eq(sessions.status, 'completed')
        )
      );

    const avg_satisfaction_rating = avgSatisfactionResult[0]?.avg
      ? Number(avgSatisfactionResult[0].avg)
      : null;

    // Calculate rebook rate
    const rebookResult = await db
      .select({
        total: count(sessions.id),
        booked: sql<number>`COUNT(CASE WHEN ${sessions.follow_up_booked} = true THEN 1 END)`,
      })
      .from(sessions)
      .where(
        and(
          eq(sessions.student_id, studentId),
          eq(sessions.status, 'completed')
        )
      );

    const totalCompleted = Number(rebookResult[0]?.total || 0);
    const totalBooked = Number(rebookResult[0]?.booked || 0);
    const rebook_rate = totalCompleted > 0 ? (totalBooked / totalCompleted) * 100 : null;

    // Count distinct tutors
    const tutorCountResult = await db
      .select({
        count: sql<number>`COUNT(DISTINCT ${sessions.tutor_id})`,
      })
      .from(sessions)
      .where(eq(sessions.student_id, studentId));

    const tutors_worked_with = Number(tutorCountResult[0]?.count || 0);

    return {
      sessions_completed,
      avg_session_score,
      avg_engagement,
      avg_satisfaction_rating,
      rebook_rate,
      tutors_worked_with,
    };
  } catch (error) {
    console.error('Error in getStudentStats:', error);
    throw new Error('Failed to calculate student stats: ' + (error as Error).message);
  }
}

/**
 * Get session summary for a student (date ranges and counts by status)
 *
 * @param studentId - The student user ID
 * @returns Session summary with date ranges and status counts
 */
export async function getStudentSessionSummary(studentId: string): Promise<StudentSessionSummary> {
  try {
    // Get date ranges and total count
    const dateRangeResult = await db
      .select({
        first_session_date: sql<Date | null>`MIN(${sessions.scheduled_start})`,
        last_session_date: sql<Date | null>`MAX(${sessions.scheduled_start})`,
        total_count: count(),
      })
      .from(sessions)
      .where(eq(sessions.student_id, studentId));

    const first_session_date = dateRangeResult[0]?.first_session_date || null;
    const last_session_date = dateRangeResult[0]?.last_session_date || null;
    const total_sessions = Number(dateRangeResult[0]?.total_count || 0);

    // Count sessions by status
    const statusCountsResult = await db
      .select({
        status: sessions.status,
        count: count(),
      })
      .from(sessions)
      .where(eq(sessions.student_id, studentId))
      .groupBy(sessions.status);

    // Initialize counts
    let completed_sessions = 0;
    let no_show_sessions = 0;
    let cancelled_sessions = 0;
    let rescheduled_sessions = 0;

    // Parse status counts
    statusCountsResult.forEach(row => {
      const statusCount = Number(row.count);
      switch (row.status) {
        case 'completed':
          completed_sessions = statusCount;
          break;
        case 'no_show_student':
        case 'no_show_tutor':
          no_show_sessions += statusCount;
          break;
        case 'cancelled':
          cancelled_sessions = statusCount;
          break;
        case 'rescheduled':
          rescheduled_sessions = statusCount;
          break;
      }
    });

    return {
      first_session_date,
      last_session_date,
      total_sessions,
      completed_sessions,
      no_show_sessions,
      cancelled_sessions,
      rescheduled_sessions,
    };
  } catch (error) {
    console.error('Error in getStudentSessionSummary:', error);
    throw new Error('Failed to get student session summary: ' + (error as Error).message);
  }
}

// ============================================
// CHURN CALCULATION FUNCTIONS
// ============================================

/**
 * Default algorithm weights if none exist in database
 */
const DEFAULT_WEIGHTS: Record<ChurnFactorCategoryType, number> = {
  first_session_satisfaction: 0.25,
  sessions_completed: 0.15,
  follow_up_booking_rate: 0.15,
  avg_session_score: 0.15,
  tutor_consistency: 0.10,
  student_engagement: 0.10,
  tutor_switch_frequency: 0.05,
  scheduling_friction: 0.03,
  response_rate: 0.02,
};

/**
 * Get current churn algorithm weights from database or return defaults
 * @returns Map of factor category to weight
 */
export async function getChurnAlgorithmWeights(): Promise<Record<ChurnFactorCategoryType, number>> {
  try {
    // Get the latest version
    const latestVersion = await db
      .select({
        version: sql<number>`MAX(${churnAlgorithmWeights.version})`,
      })
      .from(churnAlgorithmWeights);

    const version = latestVersion[0]?.version;

    if (!version) {
      return DEFAULT_WEIGHTS;
    }

    // Get all weights for the latest version
    const weights = await db
      .select({
        factor_category: churnAlgorithmWeights.factor_category,
        weight: churnAlgorithmWeights.weight,
      })
      .from(churnAlgorithmWeights)
      .where(eq(churnAlgorithmWeights.version, version));

    if (weights.length === 0) {
      return DEFAULT_WEIGHTS;
    }

    // Convert to map
    const weightMap: Record<string, number> = {};
    weights.forEach(w => {
      weightMap[w.factor_category] = Number(w.weight);
    });

    return weightMap as Record<ChurnFactorCategoryType, number>;
  } catch (error) {
    console.error('Error in getChurnAlgorithmWeights:', error);
    return DEFAULT_WEIGHTS;
  }
}

/**
 * Calculate a single churn factor for a student
 * @param studentId - The student user ID
 * @param factorCategory - The factor category to calculate
 * @param weight - The weight for this factor
 * @returns ChurnFactor object with normalized score and contribution
 */
export async function calculateChurnFactor(
  studentId: string,
  factorCategory: ChurnFactorCategoryType,
  weight: number
): Promise<ChurnFactor> {
  try {
    let value = 0;
    let normalizedScore = 0;
    let impact: 'positive' | 'negative' = 'negative';

    switch (factorCategory) {
      case 'first_session_satisfaction': {
        // Get first session score (session_number = 1)
        const firstSession = await db
          .select({
            score: sessions.overall_session_score,
          })
          .from(sessions)
          .where(
            and(
              eq(sessions.student_id, studentId),
              eq(sessions.session_number, 1),
              eq(sessions.status, 'completed')
            )
          )
          .limit(1);

        if (firstSession.length > 0 && firstSession[0].score) {
          value = Number(firstSession[0].score);
          // Normalize: 10 = 0 risk (good), 0 = 1 risk (bad)
          normalizedScore = (10 - value) / 10;
          impact = 'negative';
        } else {
          // No first session data = high risk
          normalizedScore = 1;
        }
        break;
      }

      case 'sessions_completed': {
        // More sessions = lower risk
        const sessionCount = await getStudentSessionCount(studentId, {
          status: 'completed',
        });
        value = sessionCount;
        // Normalize: >10 sessions = 0 risk, 0-2 sessions = 1 risk
        if (sessionCount >= 10) {
          normalizedScore = 0;
        } else if (sessionCount <= 2) {
          normalizedScore = 1;
        } else {
          normalizedScore = (10 - sessionCount) / 8;
        }
        impact = 'positive'; // More sessions is protective
        break;
      }

      case 'follow_up_booking_rate': {
        // Calculate follow-up booking rate
        const completedSessions = await db
          .select({
            total: count(sessions.id),
            booked: sql<number>`COUNT(CASE WHEN ${sessions.follow_up_booked} = true THEN 1 END)`,
          })
          .from(sessions)
          .where(
            and(
              eq(sessions.student_id, studentId),
              eq(sessions.status, 'completed')
            )
          );

        const total = Number(completedSessions[0]?.total || 0);
        if (total > 0) {
          const booked = Number(completedSessions[0]?.booked || 0);
          value = (booked / total) * 100;
          // Normalize: high booking rate = low risk
          normalizedScore = 1 - (value / 100);
          impact = 'positive';
        } else {
          normalizedScore = 1;
        }
        break;
      }

      case 'avg_session_score': {
        // Average session score
        const avgScore = await db
          .select({
            avg: avg(sessions.overall_session_score),
          })
          .from(sessions)
          .where(
            and(
              eq(sessions.student_id, studentId),
              eq(sessions.status, 'completed')
            )
          );

        if (avgScore[0]?.avg) {
          value = Number(avgScore[0].avg);
          // Normalize: 10 = 0 risk, 0 = 1 risk
          normalizedScore = (10 - value) / 10;
          impact = 'negative';
        } else {
          normalizedScore = 0.5; // No data = medium risk
        }
        break;
      }

      case 'tutor_consistency': {
        // Count unique tutors
        const tutorHistory = await getStudentTutorHistory(studentId);
        value = tutorHistory.length;
        // Normalize: 1 tutor = 0 risk, 3+ tutors = 1 risk
        if (value === 1) {
          normalizedScore = 0;
        } else if (value >= 3) {
          normalizedScore = 1;
        } else {
          normalizedScore = (value - 1) / 2;
        }
        impact = 'negative';
        break;
      }

      case 'student_engagement': {
        // Average engagement score from audio metrics
        const engagement = await db
          .select({
            avg: sql<number>`AVG(CAST(${sql`sam.student_engagement_score`} AS DECIMAL))`,
          })
          .from(sessions)
          .innerJoin(
            sql`session_audio_metrics sam`,
            sql`${sessions.id} = sam.session_id`
          )
          .where(
            and(
              eq(sessions.student_id, studentId),
              eq(sessions.status, 'completed'),
              eq(sessions.has_audio_analysis, true)
            )
          );

        if (engagement[0]?.avg) {
          value = Number(engagement[0].avg);
          // Normalize: 10 = 0 risk, 0 = 1 risk
          normalizedScore = (10 - value) / 10;
          impact = 'negative';
        } else {
          normalizedScore = 0.5;
        }
        break;
      }

      case 'tutor_switch_frequency': {
        // Number of times student switched tutors
        const tutorHistory = await getStudentTutorHistory(studentId);
        const switches = Math.max(0, tutorHistory.length - 1);
        value = switches;
        // Normalize: 0 switches = 0 risk, 2+ switches = 1 risk
        normalizedScore = Math.min(switches / 2, 1);
        impact = 'negative';
        break;
      }

      case 'scheduling_friction': {
        // Count reschedules
        const reschedules = await db
          .select({ count: count() })
          .from(sessions)
          .where(
            and(
              eq(sessions.student_id, studentId),
              eq(sessions.status, 'rescheduled')
            )
          );

        value = Number(reschedules[0]?.count || 0);
        // Normalize: 0 reschedules = 0 risk, 3+ = 1 risk
        normalizedScore = Math.min(value / 3, 1);
        impact = 'negative';
        break;
      }

      case 'response_rate': {
        // This would require tracking responses to messages/booking requests
        // For now, use a default value
        value = 50;
        normalizedScore = 0.5;
        impact = 'negative';
        break;
      }
    }

    // Calculate contribution to risk (inverted for positive factors)
    const contribution_to_risk = impact === 'negative'
      ? weight * normalizedScore
      : weight * (1 - normalizedScore);

    return {
      category: factorCategory,
      weight,
      value,
      normalized_score: normalizedScore,
      impact,
      contribution_to_risk,
    };
  } catch (error) {
    console.error(`Error calculating churn factor ${factorCategory}:`, error);
    // Return default factor on error
    return {
      category: factorCategory,
      weight,
      value: 0,
      normalized_score: 0.5,
      impact: 'negative',
      contribution_to_risk: weight * 0.5,
    };
  }
}

/**
 * Calculate overall churn risk score for a student (0-100)
 *
 * This function is cached for 20 minutes to improve performance.
 * Complex churn calculations with multiple factors are expensive.
 *
 * @param studentId - The student user ID
 * @returns Churn risk score 0-100
 */
export async function getStudentChurnRiskScore(studentId: string): Promise<number> {
  const cacheKey = generateCacheKey(CACHE_PREFIXES.STUDENT, {
    metric: 'churn_risk_score',
    studentId,
  });

  return withCache(cacheKey, 20 * 60, async () => {
    try {
      const weights = await getChurnAlgorithmWeights();

      // Calculate all factors
      const factors = await Promise.all(
        Object.entries(weights).map(([category, weight]) =>
          calculateChurnFactor(studentId, category as ChurnFactorCategoryType, weight)
        )
      );

      // Sum contribution to risk
      const totalRisk = factors.reduce((sum, factor) => sum + factor.contribution_to_risk, 0);

      // Convert to 0-100 scale
      return Math.min(Math.max(totalRisk * 100, 0), 100);
    } catch (error) {
      console.error('Error in getStudentChurnRiskScore:', error);
      throw new Error('Failed to calculate student churn risk score: ' + (error as Error).message);
    }
  });
}

/**
 * Get churn risk level for a student (low/medium/high)
 * @param studentId - The student user ID
 * @returns Risk level
 */
export async function getStudentChurnRiskLevel(studentId: string): Promise<'low' | 'medium' | 'high'> {
  try {
    const score = await getStudentChurnRiskScore(studentId);

    if (score > 70) {
      return 'high';
    } else if (score >= 40) {
      return 'medium';
    } else {
      return 'low';
    }
  } catch (error) {
    console.error('Error in getStudentChurnRiskLevel:', error);
    throw new Error('Failed to calculate student churn risk level: ' + (error as Error).message);
  }
}

/**
 * Get detailed churn factors for a student, separated into risk and protective factors
 *
 * This function is cached for 20 minutes (same as risk score).
 *
 * @param studentId - The student user ID
 * @returns Object with risk_factors and protective_factors arrays
 */
export async function getStudentChurnFactors(
  studentId: string
): Promise<{ risk_factors: ChurnFactor[]; protective_factors: ChurnFactor[] }> {
  const cacheKey = generateCacheKey(CACHE_PREFIXES.STUDENT, {
    metric: 'churn_factors',
    studentId,
  });

  return withCache(cacheKey, 20 * 60, async () => {
    try {
      const weights = await getChurnAlgorithmWeights();

      // Calculate all factors
      const factors = await Promise.all(
        Object.entries(weights).map(([category, weight]) =>
          calculateChurnFactor(studentId, category as ChurnFactorCategoryType, weight)
        )
      );

      // Separate into risk and protective factors
      // Risk factors have positive contribution_to_risk
      // Protective factors have negative impact (reduce risk)
      const risk_factors = factors.filter(f =>
        (f.impact === 'negative' && f.normalized_score > 0.5) ||
        (f.impact === 'positive' && f.normalized_score < 0.5)
      );

      const protective_factors = factors.filter(f =>
        (f.impact === 'positive' && f.normalized_score > 0.5) ||
        (f.impact === 'negative' && f.normalized_score < 0.5)
      );

      return {
        risk_factors,
        protective_factors,
      };
    } catch (error) {
      console.error('Error in getStudentChurnFactors:', error);
      throw new Error('Failed to calculate student churn factors: ' + (error as Error).message);
    }
  });
}

// ============================================
// CACHE INVALIDATION
// ============================================

/**
 * Invalidate all cache entries for a specific student
 *
 * Call this function when a student completes a new session or provides feedback
 * to ensure their churn risk is recalculated.
 *
 * @param studentId - The student user ID
 */
export function invalidateStudentCache(studentId: string): void {
  const cache = getCacheManager();
  cache.deleteByPrefix(`${CACHE_PREFIXES.STUDENT}:.*:studentId:${studentId}`);
}

/**
 * Invalidate all student churn calculation caches globally
 *
 * Call this function when churn algorithm weights are updated, as all
 * student churn scores need to be recalculated with new weights.
 */
export function invalidateChurnAlgorithmCache(): void {
  const cache = getCacheManager();
  // Clear all student-related caches since weights affect all calculations
  cache.deleteByPrefix(CACHE_PREFIXES.STUDENT);
  // Also clear churn-specific caches if they exist
  cache.deleteByPrefix(CACHE_PREFIXES.CHURN);
}
