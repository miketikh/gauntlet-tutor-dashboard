import { db } from '@/lib/db';
import { sessions, users, subjects, alerts, sessionAudioMetrics, sessionFeedback, tutorInsights } from '@/lib/db';
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
  top_alerts: Array<{
    id: string;
    title: string;
    description: string;
    severity: 'info' | 'warning' | 'critical';
  }>;
  top_insights: Array<{
    id: string;
    display_text: string;
    insight_type: 'strength' | 'growth_area' | 'achievement';
  }>;
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

export interface ActionableAlert {
  id: string;
  tutor_id: string;
  tutor_name: string;
  title: string;
  description: string;
  severity: 'info' | 'warning' | 'critical';
  triggered_date: Date;
  session_id: string | null;
  overall_score: number | null;
  churn_risk_level: 'low' | 'medium' | 'high';
}

export interface ActionableInsight {
  id: string;
  tutor_id: string;
  tutor_name: string;
  display_text: string;
  insight_type: 'strength' | 'growth_area' | 'achievement';
  category: string | null;
  metric_value: string | null;
  detected_at: Date;
  overall_score: number | null;
  churn_risk_level: 'low' | 'medium' | 'high';
}

export interface ActionCenterStats {
  total_critical_alerts: number;
  total_warnings: number;
  total_growth_opportunities: number;
  tutors_at_risk: number;
  avg_response_time_hours: number | null;
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

    // Fetch top 2 alerts per tutor (prioritize critical severity)
    const topAlertsData = await db
      .select({
        id: alerts.id,
        tutor_id: alerts.tutor_id,
        title: alerts.title,
        description: alerts.description,
        severity: alerts.severity,
        triggered_date: alerts.triggered_date,
      })
      .from(alerts)
      .where(
        and(
          eq(alerts.acknowledged, false),
          eq(alerts.resolved, false),
          inArray(alerts.tutor_id, tutorIds)
        )
      )
      .orderBy(
        desc(sql`CASE ${alerts.severity} WHEN 'critical' THEN 3 WHEN 'warning' THEN 2 ELSE 1 END`),
        desc(alerts.triggered_date)
      );

    // Group alerts by tutor_id and take top 2
    const alertsByTutor = new Map<string, typeof topAlertsData>();
    topAlertsData.forEach((alert) => {
      if (!alertsByTutor.has(alert.tutor_id)) {
        alertsByTutor.set(alert.tutor_id, []);
      }
      const tutorAlerts = alertsByTutor.get(alert.tutor_id)!;
      if (tutorAlerts.length < 2) {
        tutorAlerts.push(alert);
      }
    });

    // Fetch top 2 insights per tutor (prioritize growth_area)
    const topInsightsData = await db
      .select({
        id: tutorInsights.id,
        tutor_id: tutorInsights.tutor_id,
        display_text: tutorInsights.display_text,
        insight_type: tutorInsights.insight_type,
        detected_at: tutorInsights.detected_at,
      })
      .from(tutorInsights)
      .where(
        and(
          eq(tutorInsights.is_active, true),
          inArray(tutorInsights.tutor_id, tutorIds)
        )
      )
      .orderBy(
        desc(sql`CASE ${tutorInsights.insight_type} WHEN 'growth_area' THEN 3 WHEN 'strength' THEN 2 ELSE 1 END`),
        desc(tutorInsights.detected_at)
      );

    // Group insights by tutor_id and take top 2
    const insightsByTutor = new Map<string, typeof topInsightsData>();
    topInsightsData.forEach((insight) => {
      if (!insightsByTutor.has(insight.tutor_id)) {
        insightsByTutor.set(insight.tutor_id, []);
      }
      const tutorInsights = insightsByTutor.get(insight.tutor_id)!;
      if (tutorInsights.length < 2) {
        tutorInsights.push(insight);
      }
    });

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

      // Get top alerts and insights for this tutor
      const tutorAlerts = alertsByTutor.get(t.user_id) || [];
      const tutorInsights = insightsByTutor.get(t.user_id) || [];

      return {
        user_id: t.user_id,
        name: t.name,
        overall_score: Number(t.overall_score ?? 0),
        active_alert_count: alertMap.get(t.user_id) || 0,
        churn_risk_level: churnRiskLevel,
        top_alerts: tutorAlerts.map((a) => ({
          id: a.id,
          title: a.title,
          description: a.description,
          severity: a.severity as 'info' | 'warning' | 'critical',
        })),
        top_insights: tutorInsights.map((i) => ({
          id: i.id,
          display_text: i.display_text,
          insight_type: i.insight_type as 'strength' | 'growth_area' | 'achievement',
        })),
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

/**
 * Get actionable alerts across all tutors for Action Center
 * @param severity - Optional filter by severity ('critical', 'warning', 'info')
 * @param limit - Number of alerts to return (default: 50)
 * @returns Array of actionable alerts with tutor context
 */
export async function getActionableAlerts(
  severity?: 'critical' | 'warning' | 'info',
  limit: number = 50
): Promise<ActionableAlert[]> {
  if (limit <= 0) {
    throw new Error('Limit must be greater than 0');
  }

  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Build the where clause
    const whereConditions = [
      eq(alerts.acknowledged, false),
      eq(alerts.resolved, false),
    ];

    if (severity) {
      whereConditions.push(eq(alerts.severity, severity));
    }

    // Fetch alerts with tutor info
    const alertsWithTutors = await db
      .select({
        id: alerts.id,
        tutor_id: alerts.tutor_id,
        tutor_name: users.name,
        title: alerts.title,
        description: alerts.description,
        severity: alerts.severity,
        triggered_date: alerts.triggered_date,
        session_id: alerts.session_id,
      })
      .from(alerts)
      .innerJoin(users, eq(alerts.tutor_id, users.id))
      .where(and(...whereConditions))
      .orderBy(
        desc(sql`CASE ${alerts.severity} WHEN 'critical' THEN 3 WHEN 'warning' THEN 2 ELSE 1 END`),
        desc(alerts.triggered_date)
      )
      .limit(limit);

    if (alertsWithTutors.length === 0) {
      return [];
    }

    // Get tutor IDs
    const tutorIds = [...new Set(alertsWithTutors.map(a => a.tutor_id))];

    // Get tutor scores and churn risk info
    const tutorMetrics = await db
      .select({
        tutor_id: sessions.tutor_id,
        overall_score: avg(sessions.overall_session_score),
        no_show_count: sql<number>`COUNT(DISTINCT CASE WHEN ${sessions.status} = 'no_show_tutor' THEN ${sessions.id} END)`,
        reschedule_count: sql<number>`COUNT(DISTINCT CASE WHEN ${sessions.status} = 'rescheduled' AND ${sessions.rescheduled_by} = 'tutor' THEN ${sessions.id} END)`,
      })
      .from(sessions)
      .where(
        and(
          inArray(sessions.tutor_id, tutorIds),
          gte(sessions.scheduled_start, thirtyDaysAgo),
          eq(sessions.status, 'completed')
        )
      )
      .groupBy(sessions.tutor_id);

    const metricsMap = new Map(
      tutorMetrics.map(m => [
        m.tutor_id,
        {
          overall_score: Number(m.overall_score ?? 0),
          no_show_count: Number(m.no_show_count ?? 0),
          reschedule_count: Number(m.reschedule_count ?? 0),
        }
      ])
    );

    return alertsWithTutors.map(alert => {
      const metrics = metricsMap.get(alert.tutor_id);
      const noShows = metrics?.no_show_count ?? 0;
      const reschedules = metrics?.reschedule_count ?? 0;

      let churnRiskLevel: 'low' | 'medium' | 'high';
      if (noShows >= 2 || reschedules >= 4) {
        churnRiskLevel = 'high';
      } else if (noShows === 1 || reschedules >= 2) {
        churnRiskLevel = 'medium';
      } else {
        churnRiskLevel = 'low';
      }

      return {
        id: alert.id,
        tutor_id: alert.tutor_id,
        tutor_name: alert.tutor_name,
        title: alert.title,
        description: alert.description,
        severity: alert.severity as 'info' | 'warning' | 'critical',
        triggered_date: alert.triggered_date,
        session_id: alert.session_id,
        overall_score: metrics?.overall_score ?? null,
        churn_risk_level: churnRiskLevel,
      };
    });
  } catch (error) {
    console.error('Error fetching actionable alerts:', error);
    return [];
  }
}

/**
 * Get actionable insights across all tutors for Action Center
 * @param type - Optional filter by insight type ('growth_area', 'strength', 'achievement')
 * @param limit - Number of insights to return (default: 50)
 * @returns Array of actionable insights with tutor context
 */
export async function getActionableInsights(
  type?: 'growth_area' | 'strength' | 'achievement',
  limit: number = 50
): Promise<ActionableInsight[]> {
  if (limit <= 0) {
    throw new Error('Limit must be greater than 0');
  }

  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Build the where clause
    const whereConditions = [eq(tutorInsights.is_active, true)];

    if (type) {
      whereConditions.push(eq(tutorInsights.insight_type, type));
    }

    // Fetch insights with tutor info
    const insightsWithTutors = await db
      .select({
        id: tutorInsights.id,
        tutor_id: tutorInsights.tutor_id,
        tutor_name: users.name,
        display_text: tutorInsights.display_text,
        insight_type: tutorInsights.insight_type,
        category: tutorInsights.category,
        metric_value: tutorInsights.metric_value,
        detected_at: tutorInsights.detected_at,
      })
      .from(tutorInsights)
      .innerJoin(users, eq(tutorInsights.tutor_id, users.id))
      .where(and(...whereConditions))
      .orderBy(
        desc(sql`CASE ${tutorInsights.insight_type} WHEN 'growth_area' THEN 3 WHEN 'achievement' THEN 2 ELSE 1 END`),
        desc(tutorInsights.detected_at)
      )
      .limit(limit);

    if (insightsWithTutors.length === 0) {
      return [];
    }

    // Get tutor IDs
    const tutorIds = [...new Set(insightsWithTutors.map(i => i.tutor_id))];

    // Get tutor scores and churn risk info
    const tutorMetrics = await db
      .select({
        tutor_id: sessions.tutor_id,
        overall_score: avg(sessions.overall_session_score),
        no_show_count: sql<number>`COUNT(DISTINCT CASE WHEN ${sessions.status} = 'no_show_tutor' THEN ${sessions.id} END)`,
        reschedule_count: sql<number>`COUNT(DISTINCT CASE WHEN ${sessions.status} = 'rescheduled' AND ${sessions.rescheduled_by} = 'tutor' THEN ${sessions.id} END)`,
      })
      .from(sessions)
      .where(
        and(
          inArray(sessions.tutor_id, tutorIds),
          gte(sessions.scheduled_start, thirtyDaysAgo),
          eq(sessions.status, 'completed')
        )
      )
      .groupBy(sessions.tutor_id);

    const metricsMap = new Map(
      tutorMetrics.map(m => [
        m.tutor_id,
        {
          overall_score: Number(m.overall_score ?? 0),
          no_show_count: Number(m.no_show_count ?? 0),
          reschedule_count: Number(m.reschedule_count ?? 0),
        }
      ])
    );

    return insightsWithTutors.map(insight => {
      const metrics = metricsMap.get(insight.tutor_id);
      const noShows = metrics?.no_show_count ?? 0;
      const reschedules = metrics?.reschedule_count ?? 0;

      let churnRiskLevel: 'low' | 'medium' | 'high';
      if (noShows >= 2 || reschedules >= 4) {
        churnRiskLevel = 'high';
      } else if (noShows === 1 || reschedules >= 2) {
        churnRiskLevel = 'medium';
      } else {
        churnRiskLevel = 'low';
      }

      return {
        id: insight.id,
        tutor_id: insight.tutor_id,
        tutor_name: insight.tutor_name,
        display_text: insight.display_text,
        insight_type: insight.insight_type as 'strength' | 'growth_area' | 'achievement',
        category: insight.category,
        metric_value: insight.metric_value,
        detected_at: insight.detected_at,
        overall_score: metrics?.overall_score ?? null,
        churn_risk_level: churnRiskLevel,
      };
    });
  } catch (error) {
    console.error('Error fetching actionable insights:', error);
    return [];
  }
}

/**
 * Get Action Center statistics
 * @returns Statistics about alerts, insights, and at-risk tutors
 */
export async function getActionCenterStats(): Promise<ActionCenterStats> {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Count critical alerts
    const criticalAlertsResult = await db
      .select({ count: count() })
      .from(alerts)
      .where(
        and(
          eq(alerts.severity, 'critical'),
          eq(alerts.acknowledged, false),
          eq(alerts.resolved, false)
        )
      );

    const totalCriticalAlerts = Number(criticalAlertsResult[0]?.count ?? 0);

    // Count warning alerts
    const warningAlertsResult = await db
      .select({ count: count() })
      .from(alerts)
      .where(
        and(
          eq(alerts.severity, 'warning'),
          eq(alerts.acknowledged, false),
          eq(alerts.resolved, false)
        )
      );

    const totalWarnings = Number(warningAlertsResult[0]?.count ?? 0);

    // Count growth opportunities
    const growthInsightsResult = await db
      .select({ count: count() })
      .from(tutorInsights)
      .where(
        and(
          eq(tutorInsights.insight_type, 'growth_area'),
          eq(tutorInsights.is_active, true)
        )
      );

    const totalGrowthOpportunities = Number(growthInsightsResult[0]?.count ?? 0);

    // Count tutors at risk (with active alerts or churn risk)
    const tutorsAtRiskResult = await db
      .select({
        tutor_id: sessions.tutor_id,
        noShowCount: sql<number>`COUNT(CASE WHEN ${sessions.status} = 'no_show_tutor' THEN 1 END)`,
        rescheduleCount: sql<number>`COUNT(CASE WHEN ${sessions.rescheduled_by} = 'tutor' THEN 1 END)`,
      })
      .from(sessions)
      .where(
        and(
          gte(sessions.scheduled_start, thirtyDaysAgo),
          lte(sessions.scheduled_start, new Date())
        )
      )
      .groupBy(sessions.tutor_id);

    const tutorsAtRisk = tutorsAtRiskResult.filter(
      (t) => Number(t.noShowCount) >= 2 || Number(t.rescheduleCount) >= 4
    ).length;

    // Calculate average response time for resolved alerts (in hours)
    const resolvedAlertsResult = await db
      .select({
        triggered_date: alerts.triggered_date,
        resolved_at: alerts.resolved_at,
      })
      .from(alerts)
      .where(
        and(
          eq(alerts.resolved, true),
          sql`${alerts.resolved_at} IS NOT NULL`,
          gte(alerts.triggered_date, thirtyDaysAgo)
        )
      );

    let avgResponseTimeHours: number | null = null;
    if (resolvedAlertsResult.length > 0) {
      const totalHours = resolvedAlertsResult.reduce((sum, alert) => {
        if (alert.resolved_at) {
          const diff = alert.resolved_at.getTime() - alert.triggered_date.getTime();
          return sum + (diff / (1000 * 60 * 60)); // Convert to hours
        }
        return sum;
      }, 0);
      avgResponseTimeHours = totalHours / resolvedAlertsResult.length;
    }

    return {
      total_critical_alerts: totalCriticalAlerts,
      total_warnings: totalWarnings,
      total_growth_opportunities: totalGrowthOpportunities,
      tutors_at_risk: tutorsAtRisk,
      avg_response_time_hours: avgResponseTimeHours,
    };
  } catch (error) {
    console.error('Error fetching action center stats:', error);
    throw new Error('Failed to fetch action center stats');
  }
}
