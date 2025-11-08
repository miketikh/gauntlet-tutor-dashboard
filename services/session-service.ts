import { db } from '@/lib/db';
import { sessions, sessionAudioMetrics, sessionVideoMetrics, sessionScreenMetrics, sessionFeedback, sessionTranscriptHighlights, users, subjects } from '@/lib/db';
import { eq, and, desc, gte, lte, lt, sql } from 'drizzle-orm';
import type { SessionStatusType } from '@/lib/db/types';

// ============================================
// TYPESCRIPT INTERFACES
// ============================================

export interface SessionWithMetrics {
  session: {
    id: string;
    tutor_id: string;
    student_id: string;
    scheduled_start: Date;
    actual_start: Date | null;
    scheduled_duration: number;
    actual_duration: number | null;
    subject_id: string;
    session_number: number;
    status: SessionStatusType;
    tutor_showed_up: boolean;
    student_showed_up: boolean;
    rescheduled_by: string | null;
    technical_issues: boolean;
    technical_issues_description: string | null;
    has_audio_analysis: boolean;
    has_video_analysis: boolean;
    has_screen_monitoring: boolean;
    homework_assigned: boolean;
    follow_up_booked: boolean;
    overall_session_score: string | null;
    ai_summary: string | null;
    completed_at: Date | null;
    created_at: Date;
  };
  audioMetrics: {
    tutor_talk_ratio: string | null;
    student_talk_ratio: string | null;
    productive_silence_ratio: string | null;
    awkward_pause_ratio: string | null;
    student_engagement_score: string | null;
    tutor_enthusiasm_score: string | null;
    avg_student_response_delay: string | null;
    long_pauses_count: number;
    student_initiated_questions: number;
    student_frustration_count: number;
    student_confusion_count: number;
    positive_moments_count: number;
    tutor_checks_understanding_count: number;
    tutor_positive_reinforcement_count: number;
    concept_re_explanation_count: number;
    open_ended_questions: number;
    closed_ended_questions: number;
    rhetorical_questions: number;
  } | null;
  videoMetrics: {
    student_on_screen_attention_pct: string | null;
    student_visual_engagement_score: string | null;
    distraction_events_count: number;
    confusion_moments_count: number;
    tutor_uses_visual_aids: boolean;
    student_taking_notes_duration: number;
  } | null;
  screenMetrics: {
    active_tab_focus_pct: string | null;
    tab_switches_count: number;
    whiteboard_usage_minutes: number;
    messaging_app_detected: boolean;
    gaming_detected: boolean;
  } | null;
  feedback: {
    student_satisfaction_rating: number;
    feedback_text: string | null;
    submitted_at: Date;
  } | null;
  transcriptHighlights: Array<{
    id: string;
    timestamp_seconds: number;
    speaker: string;
    text: string;
    highlight_type: string;
  }>;
  subject: {
    id: string;
    name: string;
    category: string;
  };
}

export interface SessionSummary {
  id: string;
  tutor_id: string;
  student_id: string;
  scheduled_start: Date;
  scheduled_duration: number;
  subject_id: string;
  subject_name: string;
  session_number: number;
  status: SessionStatusType;
  overall_session_score: string | null;
  follow_up_booked: boolean;
  created_at: Date;
}

export interface SessionFilters {
  status?: SessionStatusType | SessionStatusType[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  limit?: number;
  offset?: number;
}

export interface RecentSessionFilters {
  status?: 'completed' | 'all';
  flagged_only?: boolean;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

export interface RecentSession {
  id: string;
  tutor_id: string;
  tutor_name: string;
  student_id: string;
  subject_name: string;
  scheduled_start: Date;
  session_number: number;
  status: SessionStatusType;
  overall_session_score: string | null;
  created_at: Date;
}

// PR 1.2: Student Session History Interfaces
export interface StudentSessionHistoryItem {
  id: string;
  tutor_id: string;
  tutor_name: string;
  student_id: string;
  subject_name: string;
  scheduled_start: Date;
  actual_duration: number | null;
  session_number: number;
  status: SessionStatusType;
  overall_session_score: string | null;
  student_engagement_score: string | null;
  student_satisfaction_rating: number | null;
  created_at: Date;
}

export interface TutorSwitch {
  from_tutor_id: string;
  to_tutor_id: string;
  switch_date: Date;
  session_id: string;
}

export interface FirstSessionOutcome {
  tutor_id: string;
  tutor_name: string;
  session_id: string;
  scheduled_start: Date;
  overall_session_score: string | null;
  student_satisfaction_rating: number | null;
  follow_up_booked: boolean;
}

export interface StudentSessionHistoryFilters {
  tutor_id?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
  status?: SessionStatusType;
  limit?: number;
}

// ============================================
// SERVICE FUNCTIONS
// ============================================

/**
 * Get a single session by ID with all related metrics
 *
 * Fetches a complete session record including audio, video, and screen metrics,
 * feedback, and transcript highlights. Optional metrics (video/screen) return null
 * if not available, allowing graceful handling of incomplete data.
 *
 * @param sessionId - The session UUID
 * @returns Session with all metrics, feedback, and transcript highlights, or null if not found
 *
 * @example
 * ```typescript
 * const session = await getSessionById('123e4567-e89b-12d3-a456-426614174000');
 * if (session) {
 *   console.log(`Session score: ${session.session.overall_session_score}`);
 *   if (session.audioMetrics) {
 *     console.log(`Talk ratio: ${session.audioMetrics.tutor_talk_ratio}`);
 *   }
 * }
 * ```
 *
 * @note Uses leftJoin for optional metrics, so missing data returns null
 * @note Performance: ~50-100ms for sessions with all metrics
 */
export async function getSessionById(sessionId: string): Promise<SessionWithMetrics | null> {
  try {
    // Fetch session with subject
    const sessionResult = await db
      .select({
        session: sessions,
        subject: subjects,
      })
      .from(sessions)
      .innerJoin(subjects, eq(sessions.subject_id, subjects.id))
      .where(eq(sessions.id, sessionId))
      .limit(1);

    if (sessionResult.length === 0) {
      return null;
    }

    const { session, subject } = sessionResult[0];

    // Fetch audio metrics (optional)
    const audioResult = await db
      .select()
      .from(sessionAudioMetrics)
      .where(eq(sessionAudioMetrics.session_id, sessionId))
      .limit(1);

    // Fetch video metrics (optional)
    const videoResult = await db
      .select()
      .from(sessionVideoMetrics)
      .where(eq(sessionVideoMetrics.session_id, sessionId))
      .limit(1);

    // Fetch screen metrics (optional)
    const screenResult = await db
      .select()
      .from(sessionScreenMetrics)
      .where(eq(sessionScreenMetrics.session_id, sessionId))
      .limit(1);

    // Fetch feedback (optional)
    const feedbackResult = await db
      .select()
      .from(sessionFeedback)
      .where(eq(sessionFeedback.session_id, sessionId))
      .limit(1);

    // Fetch transcript highlights
    const highlights = await db
      .select()
      .from(sessionTranscriptHighlights)
      .where(eq(sessionTranscriptHighlights.session_id, sessionId));

    return {
      session,
      audioMetrics: audioResult.length > 0 ? audioResult[0] : null,
      videoMetrics: videoResult.length > 0 ? videoResult[0] : null,
      screenMetrics: screenResult.length > 0 ? screenResult[0] : null,
      feedback: feedbackResult.length > 0 ? feedbackResult[0] : null,
      transcriptHighlights: highlights,
      subject,
    };
  } catch (error) {
    console.error('Error in getSessionById:', error);
    throw new Error('Failed to fetch session: ' + (error as Error).message);
  }
}

/**
 * Get sessions for a specific tutor with optional filters
 *
 * Retrieves session summaries for a tutor with filtering and pagination support.
 * Ordered by scheduled start date descending (most recent first).
 *
 * @param tutorId - The tutor user ID
 * @param options - Optional filters for status, date range, limit, and offset
 * @param options.status - Filter by session status (single value or array)
 * @param options.dateRange - Filter by date range (start and end)
 * @param options.limit - Maximum number of results to return
 * @param options.offset - Number of results to skip (for pagination)
 * @returns Array of session summaries with subject information
 *
 * @example
 * ```typescript
 * // Get last 10 completed sessions
 * const sessions = await getSessionsByTutorId('tutor-123', {
 *   status: 'completed',
 *   limit: 10
 * });
 *
 * // Get sessions in date range
 * const recentSessions = await getSessionsByTutorId('tutor-123', {
 *   dateRange: {
 *     start: new Date('2024-01-01'),
 *     end: new Date('2024-01-31')
 *   }
 * });
 * ```
 *
 * @note Uses innerJoin for subject, so sessions without subjects are excluded
 * @note Performance: Indexed on tutor_id and scheduled_start for fast queries
 */
export async function getSessionsByTutorId(
  tutorId: string,
  options?: SessionFilters
): Promise<SessionSummary[]> {
  try {
    const conditions = [eq(sessions.tutor_id, tutorId)];

    // Filter by status
    if (options?.status) {
      if (Array.isArray(options.status)) {
        conditions.push(sql`${sessions.status} = ANY(${options.status})`);
      } else {
        conditions.push(eq(sessions.status, options.status));
      }
    }

    // Filter by date range
    if (options?.dateRange) {
      conditions.push(gte(sessions.scheduled_start, options.dateRange.start));
      conditions.push(lte(sessions.scheduled_start, options.dateRange.end));
    }

    let query = db
      .select({
        id: sessions.id,
        tutor_id: sessions.tutor_id,
        student_id: sessions.student_id,
        scheduled_start: sessions.scheduled_start,
        scheduled_duration: sessions.scheduled_duration,
        subject_id: sessions.subject_id,
        subject_name: subjects.name,
        session_number: sessions.session_number,
        status: sessions.status,
        overall_session_score: sessions.overall_session_score,
        follow_up_booked: sessions.follow_up_booked,
        created_at: sessions.created_at,
      })
      .from(sessions)
      .innerJoin(subjects, eq(sessions.subject_id, subjects.id))
      .where(and(...conditions))
      .orderBy(desc(sessions.scheduled_start));

    if (options?.limit) {
      query = query.limit(options.limit) as any;
    }

    if (options?.offset) {
      query = query.offset(options.offset) as any;
    }

    return await query;
  } catch (error) {
    console.error('Error in getSessionsByTutorId:', error);
    throw new Error('Failed to fetch tutor sessions: ' + (error as Error).message);
  }
}

/**
 * Get sessions for a specific student with optional filters
 *
 * Retrieves session summaries for a student with tutor information included.
 * Similar to getSessionsByTutorId but includes tutor name in results.
 *
 * @param studentId - The student user ID
 * @param options - Optional filters for status, date range, limit, and offset
 * @param options.status - Filter by session status (single value or array)
 * @param options.dateRange - Filter by date range (start and end)
 * @param options.limit - Maximum number of results to return
 * @param options.offset - Number of results to skip (for pagination)
 * @returns Array of session summaries with tutor and subject information
 *
 * @example
 * ```typescript
 * // Get student's recent sessions
 * const sessions = await getSessionsByStudentId('student-123', {
 *   status: 'completed',
 *   limit: 20
 * });
 *
 * sessions.forEach(session => {
 *   console.log(`Session with ${session.tutor_name}: ${session.overall_session_score}`);
 * });
 * ```
 *
 * @note Includes session_number for tracking student progression
 * @note Performance: Indexed on student_id and scheduled_start
 */
export async function getSessionsByStudentId(
  studentId: string,
  options?: SessionFilters
): Promise<Array<SessionSummary & { tutor_name: string }>> {
  try {
    const conditions = [eq(sessions.student_id, studentId)];

    // Filter by status
    if (options?.status) {
      if (Array.isArray(options.status)) {
        conditions.push(sql`${sessions.status} = ANY(${options.status})`);
      } else {
        conditions.push(eq(sessions.status, options.status));
      }
    }

    // Filter by date range
    if (options?.dateRange) {
      conditions.push(gte(sessions.scheduled_start, options.dateRange.start));
      conditions.push(lte(sessions.scheduled_start, options.dateRange.end));
    }

    let query = db
      .select({
        id: sessions.id,
        tutor_id: sessions.tutor_id,
        tutor_name: users.name,
        student_id: sessions.student_id,
        scheduled_start: sessions.scheduled_start,
        scheduled_duration: sessions.scheduled_duration,
        subject_id: sessions.subject_id,
        subject_name: subjects.name,
        session_number: sessions.session_number,
        status: sessions.status,
        overall_session_score: sessions.overall_session_score,
        follow_up_booked: sessions.follow_up_booked,
        created_at: sessions.created_at,
      })
      .from(sessions)
      .innerJoin(subjects, eq(sessions.subject_id, subjects.id))
      .innerJoin(users, eq(sessions.tutor_id, users.id))
      .where(and(...conditions))
      .orderBy(desc(sessions.scheduled_start));

    if (options?.limit) {
      query = query.limit(options.limit) as any;
    }

    if (options?.offset) {
      query = query.offset(options.offset) as any;
    }

    return await query;
  } catch (error) {
    console.error('Error in getSessionsByStudentId:', error);
    throw new Error('Failed to fetch student sessions: ' + (error as Error).message);
  }
}

/**
 * Get recent sessions with filters for dashboard views
 *
 * Retrieves recent sessions across all tutors and students for admin dashboard.
 * Supports filtering by completion status, flagged sessions (low scores), and date range.
 *
 * @param limit - Maximum number of sessions to return
 * @param filters - Optional filters for status, flagged sessions, date range
 * @param filters.status - 'completed' for only completed sessions, 'all' for all statuses
 * @param filters.flagged_only - If true, only return sessions with score < 6.5
 * @param filters.dateRange - Filter by date range (start and end)
 * @returns Array of recent sessions with tutor and subject information
 *
 * @example
 * ```typescript
 * // Get flagged sessions that need attention
 * const flaggedSessions = await getRecentSessions(10, {
 *   status: 'completed',
 *   flagged_only: true
 * });
 *
 * // Get all recent sessions in a date range
 * const sessions = await getRecentSessions(50, {
 *   dateRange: {
 *     start: new Date('2024-01-01'),
 *     end: new Date('2024-01-31')
 *   }
 * });
 * ```
 *
 * @note Flagged threshold is 6.5 - sessions below this indicate potential issues
 * @note Performance: Use with limit to avoid expensive full table scans
 */
export async function getRecentSessions(
  limit: number,
  filters?: RecentSessionFilters
): Promise<RecentSession[]> {
  try {
    const conditions = [];

    // Filter by status
    if (filters?.status === 'completed') {
      conditions.push(eq(sessions.status, 'completed'));
    }

    // Filter by flagged sessions (score < 6.5)
    if (filters?.flagged_only) {
      conditions.push(lt(sessions.overall_session_score, '6.5'));
    }

    // Filter by date range
    if (filters?.dateRange) {
      conditions.push(gte(sessions.scheduled_start, filters.dateRange.start));
      conditions.push(lte(sessions.scheduled_start, filters.dateRange.end));
    }

    const query = db
      .select({
        id: sessions.id,
        tutor_id: sessions.tutor_id,
        tutor_name: users.name,
        student_id: sessions.student_id,
        subject_name: subjects.name,
        scheduled_start: sessions.scheduled_start,
        session_number: sessions.session_number,
        status: sessions.status,
        overall_session_score: sessions.overall_session_score,
        created_at: sessions.created_at,
      })
      .from(sessions)
      .innerJoin(subjects, eq(sessions.subject_id, subjects.id))
      .innerJoin(users, eq(sessions.tutor_id, users.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(sessions.scheduled_start))
      .limit(limit);

    return await query;
  } catch (error) {
    console.error('Error in getRecentSessions:', error);
    throw new Error('Failed to fetch recent sessions: ' + (error as Error).message);
  }
}

// ============================================
// PR 1.2: STUDENT SESSION HISTORY FUNCTIONS
// ============================================

/**
 * Get student session history with tutor info and metrics
 *
 * Retrieves all sessions for a student with tutor context, including engagement
 * scores and satisfaction ratings. Supports filtering by tutor, date range, and status.
 *
 * @param studentId - The student user ID
 * @param options - Optional filters for tutor, date range, status, limit
 * @returns Array of session history items with tutor and metric information
 *
 * @example
 * ```typescript
 * // Get last 100 completed sessions
 * const history = await getStudentSessionHistory('student-123', {
 *   status: 'completed',
 *   limit: 100
 * });
 *
 * // Get sessions with specific tutor
 * const tutorSessions = await getStudentSessionHistory('student-123', {
 *   tutor_id: 'tutor-456'
 * });
 * ```
 */
export async function getStudentSessionHistory(
  studentId: string,
  options?: StudentSessionHistoryFilters
): Promise<StudentSessionHistoryItem[]> {
  try {
    const conditions = [eq(sessions.student_id, studentId)];

    // Filter by tutor
    if (options?.tutor_id) {
      conditions.push(eq(sessions.tutor_id, options.tutor_id));
    }

    // Filter by status
    if (options?.status) {
      conditions.push(eq(sessions.status, options.status));
    }

    // Filter by date range
    if (options?.dateRange) {
      conditions.push(gte(sessions.scheduled_start, options.dateRange.start));
      conditions.push(lte(sessions.scheduled_start, options.dateRange.end));
    }

    let query = db
      .select({
        id: sessions.id,
        tutor_id: sessions.tutor_id,
        tutor_name: users.name,
        student_id: sessions.student_id,
        subject_name: subjects.name,
        scheduled_start: sessions.scheduled_start,
        actual_duration: sessions.actual_duration,
        session_number: sessions.session_number,
        status: sessions.status,
        overall_session_score: sessions.overall_session_score,
        student_engagement_score: sessionAudioMetrics.student_engagement_score,
        student_satisfaction_rating: sessionFeedback.student_satisfaction_rating,
        created_at: sessions.created_at,
      })
      .from(sessions)
      .innerJoin(subjects, eq(sessions.subject_id, subjects.id))
      .innerJoin(users, eq(sessions.tutor_id, users.id))
      .leftJoin(sessionAudioMetrics, eq(sessions.id, sessionAudioMetrics.session_id))
      .leftJoin(sessionFeedback, eq(sessions.id, sessionFeedback.session_id))
      .where(and(...conditions))
      .orderBy(desc(sessions.scheduled_start));

    if (options?.limit) {
      query = query.limit(options.limit) as any;
    }

    return await query;
  } catch (error) {
    console.error('Error in getStudentSessionHistory:', error);
    throw new Error('Failed to fetch student session history: ' + (error as Error).message);
  }
}

/**
 * Get tutor switches for a student
 *
 * Identifies sessions where the student switched to a different tutor,
 * which is an important signal for churn prediction.
 *
 * @param studentId - The student user ID
 * @returns Array of tutor switch events with dates and session IDs
 *
 * @example
 * ```typescript
 * const switches = await getStudentTutorSwitches('student-123');
 * switches.forEach(sw => {
 *   console.log(`Switched from ${sw.from_tutor_id} to ${sw.to_tutor_id} on ${sw.switch_date}`);
 * });
 * ```
 */
export async function getStudentTutorSwitches(studentId: string): Promise<TutorSwitch[]> {
  try {
    // Get all sessions for student ordered by date
    const allSessions = await db
      .select({
        id: sessions.id,
        tutor_id: sessions.tutor_id,
        scheduled_start: sessions.scheduled_start,
      })
      .from(sessions)
      .where(eq(sessions.student_id, studentId))
      .orderBy(sessions.scheduled_start);

    // Detect tutor changes
    const switches: TutorSwitch[] = [];
    for (let i = 1; i < allSessions.length; i++) {
      const prevSession = allSessions[i - 1];
      const currSession = allSessions[i];

      if (prevSession.tutor_id !== currSession.tutor_id) {
        switches.push({
          from_tutor_id: prevSession.tutor_id,
          to_tutor_id: currSession.tutor_id,
          switch_date: currSession.scheduled_start,
          session_id: currSession.id,
        });
      }
    }

    return switches;
  } catch (error) {
    console.error('Error in getStudentTutorSwitches:', error);
    throw new Error('Failed to fetch student tutor switches: ' + (error as Error).message);
  }
}

/**
 * Get first session outcomes for all tutors a student worked with
 *
 * First sessions are heavily weighted in churn prediction (24% of churners fail here).
 * This function retrieves the first session with each tutor to analyze initial experiences.
 *
 * @param studentId - The student user ID
 * @returns Array of first session outcomes with scores and satisfaction
 *
 * @example
 * ```typescript
 * const firstSessions = await getStudentFirstSessionOutcomes('student-123');
 * const poorFirstSessions = firstSessions.filter(s =>
 *   Number(s.overall_session_score) < 6.5
 * );
 * ```
 */
export async function getStudentFirstSessionOutcomes(
  studentId: string
): Promise<FirstSessionOutcome[]> {
  try {
    const result = await db
      .select({
        tutor_id: sessions.tutor_id,
        tutor_name: users.name,
        session_id: sessions.id,
        scheduled_start: sessions.scheduled_start,
        overall_session_score: sessions.overall_session_score,
        student_satisfaction_rating: sessionFeedback.student_satisfaction_rating,
        follow_up_booked: sessions.follow_up_booked,
      })
      .from(sessions)
      .innerJoin(users, eq(sessions.tutor_id, users.id))
      .leftJoin(sessionFeedback, eq(sessions.id, sessionFeedback.session_id))
      .where(
        and(
          eq(sessions.student_id, studentId),
          eq(sessions.session_number, 1)
        )
      )
      .orderBy(sessions.scheduled_start);

    return result;
  } catch (error) {
    console.error('Error in getStudentFirstSessionOutcomes:', error);
    throw new Error('Failed to fetch student first session outcomes: ' + (error as Error).message);
  }
}
