import { db } from '@/lib/db';
import { alerts, sessions, sessionAudioMetrics } from '@/lib/db';
import { eq, and, desc, gte, lte, sql, count, inArray } from 'drizzle-orm';
import type { AlertTypeType, AlertSeverityType } from '@/lib/db/types';

// ============================================
// TYPESCRIPT INTERFACES
// ============================================

export interface Alert {
  id: string;
  tutor_id: string;
  alert_type: AlertTypeType;
  severity: AlertSeverityType;
  title: string;
  description: string;
  triggered_date: Date;
  session_id: string | null;
  acknowledged: boolean;
  acknowledged_by: string | null;
  acknowledged_at: Date | null;
  action_taken: string | null;
  resolved: boolean;
  resolved_at: Date | null;
  created_at: Date;
}

// ============================================
// SERVICE FUNCTIONS
// ============================================

/**
 * Get all active (unresolved) alerts for a tutor
 * @param tutorId - The tutor user ID
 * @returns Array of unresolved alerts, ordered by severity (critical first), then by triggered date
 */
export async function getActiveAlerts(tutorId: string): Promise<Alert[]> {
  try {
    const result = await db
      .select()
      .from(alerts)
      .where(
        and(
          eq(alerts.tutor_id, tutorId),
          eq(alerts.resolved, false)
        )
      )
      .orderBy(
        sql`CASE
          WHEN ${alerts.severity} = 'critical' THEN 1
          WHEN ${alerts.severity} = 'warning' THEN 2
          WHEN ${alerts.severity} = 'info' THEN 3
          ELSE 4
        END`,
        desc(alerts.triggered_date)
      );

    return result.map(alert => ({
      ...alert,
      triggered_date: new Date(alert.triggered_date),
      acknowledged_at: alert.acknowledged_at ? new Date(alert.acknowledged_at) : null,
      resolved_at: alert.resolved_at ? new Date(alert.resolved_at) : null,
      created_at: new Date(alert.created_at),
    }));
  } catch (error) {
    console.error('Error in getActiveAlerts:', error);
    throw new Error('Failed to fetch active alerts: ' + (error as Error).message);
  }
}

/**
 * Get count of unresolved alerts for a tutor, optionally filtered by severity
 * @param tutorId - The tutor user ID
 * @param severity - Optional severity filter ('info', 'warning', 'critical')
 * @returns Count of unresolved alerts
 */
export async function getTutorAlertCount(
  tutorId: string,
  severity?: AlertSeverityType
): Promise<number> {
  try {
    const conditions = [
      eq(alerts.tutor_id, tutorId),
      eq(alerts.resolved, false)
    ];

    if (severity) {
      conditions.push(eq(alerts.severity, severity));
    }

    const result = await db
      .select({ count: count() })
      .from(alerts)
      .where(and(...conditions));

    return result[0]?.count || 0;
  } catch (error) {
    console.error('Error in getTutorAlertCount:', error);
    throw new Error('Failed to count alerts: ' + (error as Error).message);
  }
}

/**
 * Acknowledge an alert (mark as seen by admin)
 * @param alertId - The alert ID
 * @param acknowledgedBy - User ID of admin acknowledging the alert
 * @returns Updated alert
 */
export async function acknowledgeAlert(
  alertId: string,
  acknowledgedBy: string
): Promise<Alert> {
  try {
    const result = await db
      .update(alerts)
      .set({
        acknowledged: true,
        acknowledged_by: acknowledgedBy,
        acknowledged_at: new Date(),
      })
      .where(eq(alerts.id, alertId))
      .returning();

    if (result.length === 0) {
      throw new Error('Alert not found');
    }

    const alert = result[0];
    return {
      ...alert,
      triggered_date: new Date(alert.triggered_date),
      acknowledged_at: alert.acknowledged_at ? new Date(alert.acknowledged_at) : null,
      resolved_at: alert.resolved_at ? new Date(alert.resolved_at) : null,
      created_at: new Date(alert.created_at),
    };
  } catch (error) {
    console.error('Error in acknowledgeAlert:', error);
    throw new Error('Failed to acknowledge alert: ' + (error as Error).message);
  }
}

/**
 * Resolve an alert with action taken
 * @param alertId - The alert ID
 * @param actionTaken - Description of action taken to resolve the alert
 * @returns Updated alert
 */
export async function resolveAlert(
  alertId: string,
  actionTaken: string
): Promise<Alert> {
  try {
    const result = await db
      .update(alerts)
      .set({
        resolved: true,
        resolved_at: new Date(),
        action_taken: actionTaken,
      })
      .where(eq(alerts.id, alertId))
      .returning();

    if (result.length === 0) {
      throw new Error('Alert not found');
    }

    const alert = result[0];
    return {
      ...alert,
      triggered_date: new Date(alert.triggered_date),
      acknowledged_at: alert.acknowledged_at ? new Date(alert.acknowledged_at) : null,
      resolved_at: alert.resolved_at ? new Date(alert.resolved_at) : null,
      created_at: new Date(alert.created_at),
    };
  } catch (error) {
    console.error('Error in resolveAlert:', error);
    throw new Error('Failed to resolve alert: ' + (error as Error).message);
  }
}

/**
 * Check all alert conditions for a tutor and generate new alerts as needed
 * Prevents duplicate alerts by checking if unresolved alert of same type exists
 * @param tutorId - The tutor user ID
 * @returns Array of newly created alerts
 */
export async function checkAndGenerateAlerts(tutorId: string): Promise<Alert[]> {
  try {
    const newAlerts: Alert[] = [];
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Get existing unresolved alerts to prevent duplicates
    const existingAlerts = await db
      .select({ alert_type: alerts.alert_type })
      .from(alerts)
      .where(
        and(
          eq(alerts.tutor_id, tutorId),
          eq(alerts.resolved, false)
        )
      );

    const existingAlertTypes = new Set(existingAlerts.map(a => a.alert_type));

    // Helper to create alert if type doesn't exist
    async function createAlertIfNew(
      alertType: AlertTypeType,
      severity: AlertSeverityType,
      title: string,
      description: string,
      sessionId?: string
    ) {
      if (existingAlertTypes.has(alertType)) {
        return; // Alert already exists
      }

      const result = await db
        .insert(alerts)
        .values({
          tutor_id: tutorId,
          alert_type: alertType,
          severity,
          title,
          description,
          session_id: sessionId || null,
        })
        .returning();

      if (result.length > 0) {
        const alert = result[0];
        newAlerts.push({
          ...alert,
          triggered_date: new Date(alert.triggered_date),
          acknowledged_at: alert.acknowledged_at ? new Date(alert.acknowledged_at) : null,
          resolved_at: alert.resolved_at ? new Date(alert.resolved_at) : null,
          created_at: new Date(alert.created_at),
        });
      }
    }

    // 1. Check for high talk ratio (warning): > 0.65 in 70%+ of last 10 sessions
    const recentSessions = await db
      .select({
        session_id: sessions.id,
        tutor_talk_ratio: sessionAudioMetrics.tutor_talk_ratio,
        overall_score: sessions.overall_session_score,
      })
      .from(sessions)
      .leftJoin(sessionAudioMetrics, eq(sessions.id, sessionAudioMetrics.session_id))
      .where(
        and(
          eq(sessions.tutor_id, tutorId),
          eq(sessions.status, 'completed'),
          gte(sessions.completed_at, thirtyDaysAgo)
        )
      )
      .orderBy(desc(sessions.completed_at))
      .limit(10);

    if (recentSessions.length >= 5) {
      const highTalkRatioCount = recentSessions.filter(
        s => s.tutor_talk_ratio && parseFloat(s.tutor_talk_ratio) > 0.65
      ).length;
      const percentage = highTalkRatioCount / recentSessions.length;

      if (percentage >= 0.7) {
        await createAlertIfNew(
          'high_talk_ratio',
          'warning',
          'High Talk Ratio Pattern Detected',
          `Tutor is talking for more than 65% of session time in ${Math.round(percentage * 100)}% of recent sessions. Consider encouraging more student participation and dialogue.`
        );
      }
    }

    // 2. Check for low understanding checks (warning): avg < 4 in last 10 sessions
    if (recentSessions.length >= 5) {
      const sessionsWithChecks = recentSessions.filter(s => s.tutor_talk_ratio !== null);

      if (sessionsWithChecks.length > 0) {
        // Use the session IDs from recentSessions instead of a subquery
        const sessionIds = recentSessions.map(s => s.session_id);

        const understandingChecks = await db
          .select({
            avg_checks: sql<number>`AVG(${sessionAudioMetrics.tutor_checks_understanding_count})`,
          })
          .from(sessionAudioMetrics)
          .where(
            inArray(sessionAudioMetrics.session_id, sessionIds)
          );

        const avgChecks = understandingChecks[0]?.avg_checks || 0;

        if (avgChecks < 4) {
          await createAlertIfNew(
            'low_understanding_checks',
            'warning',
            'Infrequent Understanding Checks',
            `Tutor is averaging only ${avgChecks.toFixed(1)} understanding checks per session (threshold: 4). Encourage more frequent verification of student comprehension.`
          );
        }
      }
    }

    // 3. Check for poor first session (critical): score < 6.5 within last 7 days
    const poorFirstSessions = await db
      .select({
        session_id: sessions.id,
        overall_score: sessions.overall_session_score,
        student_id: sessions.student_id,
      })
      .from(sessions)
      .where(
        and(
          eq(sessions.tutor_id, tutorId),
          eq(sessions.session_number, 1),
          eq(sessions.status, 'completed'),
          gte(sessions.completed_at, sevenDaysAgo)
        )
      );

    for (const session of poorFirstSessions) {
      if (session.overall_score && parseFloat(session.overall_score) < 6.5) {
        await createAlertIfNew(
          'poor_first_session',
          'critical',
          'Poor First Session Performance',
          `First session with student scored ${session.overall_score}/10 (threshold: 6.5). First sessions are critical for retention - immediate coaching recommended.`,
          session.session_id
        );
      }
    }

    // 4. Check for no-show pattern (critical): >= 2 no-shows in last 30 days
    const noShowCount = await db
      .select({ count: count() })
      .from(sessions)
      .where(
        and(
          eq(sessions.tutor_id, tutorId),
          eq(sessions.status, 'no_show_tutor'),
          gte(sessions.scheduled_start, thirtyDaysAgo)
        )
      );

    const noShows = noShowCount[0]?.count || 0;
    if (noShows >= 2) {
      await createAlertIfNew(
        'no_show_pattern',
        'critical',
        'No-Show Pattern Detected',
        `Tutor has ${noShows} no-shows in the last 30 days (threshold: 2). This indicates a reliability issue requiring immediate attention.`
      );
    }

    // 5. Check for high reschedule rate (warning): >= 5 reschedules in last 30 days
    const rescheduleCount = await db
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

    const reschedules = rescheduleCount[0]?.count || 0;
    if (reschedules >= 5) {
      await createAlertIfNew(
        'high_reschedule_rate',
        'warning',
        'High Reschedule Rate',
        `Tutor has initiated ${reschedules} reschedules in the last 30 days (threshold: 5). This may impact student experience and retention.`
      );
    }

    // 6. Check for declining performance (warning): avg score dropped >15% over last 30 days vs previous 30 days
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    const recentAvg = await db
      .select({
        avg_score: sql<number>`AVG(CAST(${sessions.overall_session_score} AS DECIMAL))`,
      })
      .from(sessions)
      .where(
        and(
          eq(sessions.tutor_id, tutorId),
          eq(sessions.status, 'completed'),
          gte(sessions.completed_at, thirtyDaysAgo),
          lte(sessions.completed_at, now)
        )
      );

    const previousAvg = await db
      .select({
        avg_score: sql<number>`AVG(CAST(${sessions.overall_session_score} AS DECIMAL))`,
      })
      .from(sessions)
      .where(
        and(
          eq(sessions.tutor_id, tutorId),
          eq(sessions.status, 'completed'),
          gte(sessions.completed_at, sixtyDaysAgo),
          lte(sessions.completed_at, thirtyDaysAgo)
        )
      );

    const recentScore = recentAvg[0]?.avg_score || null;
    const previousScore = previousAvg[0]?.avg_score || null;

    if (recentScore && previousScore && previousScore > 0) {
      const percentageChange = ((recentScore - previousScore) / previousScore) * 100;

      if (percentageChange < -15) {
        await createAlertIfNew(
          'declining_performance',
          'warning',
          'Declining Performance Trend',
          `Session scores have dropped ${Math.abs(percentageChange).toFixed(1)}% over the last 30 days (from ${previousScore.toFixed(1)} to ${recentScore.toFixed(1)}). Investigate potential causes and provide coaching support.`
        );
      }
    }

    return newAlerts;
  } catch (error) {
    console.error('Error in checkAndGenerateAlerts:', error);
    throw new Error('Failed to check and generate alerts: ' + (error as Error).message);
  }
}
