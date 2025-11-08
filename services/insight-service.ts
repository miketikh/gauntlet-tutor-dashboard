import { db } from '@/lib/db';
import { tutorInsights, sessions, sessionAudioMetrics, sessionVideoMetrics } from '@/lib/db';
import { eq, and, desc, gte, sql } from 'drizzle-orm';
import type { InsightTypeType, InsightCategoryType } from '@/lib/db/types';

// ============================================
// TYPESCRIPT INTERFACES
// ============================================

export interface TutorInsight {
  id: string;
  tutor_id: string;
  insight_type: InsightTypeType;
  category: InsightCategoryType;
  display_text: string;
  detected_at: Date;
  last_confirmed_at: Date | null;
  is_active: boolean;
  resolved_at: Date | null;
  sample_sessions: string[] | null;
  metric_value: string | null;
}

interface InsightPattern {
  category: InsightCategoryType;
  insight_type: InsightTypeType;
  display_text: string;
  metric_value: number;
  sample_sessions: string[];
}

// ============================================
// SERVICE FUNCTIONS
// ============================================

/**
 * Get tutor insights, optionally filtered by type
 * @param tutorId - The tutor user ID
 * @param insightType - Optional filter: 'strength', 'growth_area', or 'achievement'
 * @returns Array of active insights ordered by detected date (most recent first)
 */
export async function getTutorInsights(
  tutorId: string,
  insightType?: InsightTypeType
): Promise<TutorInsight[]> {
  try {
    const conditions = [
      eq(tutorInsights.tutor_id, tutorId),
      eq(tutorInsights.is_active, true)
    ];

    if (insightType) {
      conditions.push(eq(tutorInsights.insight_type, insightType));
    }

    const result = await db
      .select()
      .from(tutorInsights)
      .where(and(...conditions))
      .orderBy(desc(tutorInsights.detected_at));

    return result.map(insight => ({
      ...insight,
      detected_at: new Date(insight.detected_at),
      last_confirmed_at: insight.last_confirmed_at ? new Date(insight.last_confirmed_at) : null,
      resolved_at: insight.resolved_at ? new Date(insight.resolved_at) : null,
    }));
  } catch (error) {
    console.error('Error in getTutorInsights:', error);
    throw new Error('Failed to fetch tutor insights: ' + (error as Error).message);
  }
}

/**
 * Detect patterns in recent sessions and generate/update insights
 * @param tutorId - The tutor user ID
 * @returns Array of newly created or updated insights
 */
export async function detectAndGenerateInsights(tutorId: string): Promise<TutorInsight[]> {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const newInsights: TutorInsight[] = [];

    // Fetch recent sessions with metrics
    const recentSessions = await db
      .select({
        session_id: sessions.id,
        overall_score: sessions.overall_session_score,
        session_number: sessions.session_number,
        // Audio metrics
        tutor_talk_ratio: sessionAudioMetrics.tutor_talk_ratio,
        student_engagement_score: sessionAudioMetrics.student_engagement_score,
        tutor_checks_understanding_count: sessionAudioMetrics.tutor_checks_understanding_count,
        open_ended_questions: sessionAudioMetrics.open_ended_questions,
        closed_ended_questions: sessionAudioMetrics.closed_ended_questions,
        tutor_positive_reinforcement_count: sessionAudioMetrics.tutor_positive_reinforcement_count,
        // Video metrics (optional)
        tutor_uses_visual_aids: sessionVideoMetrics.tutor_uses_visual_aids,
      })
      .from(sessions)
      .leftJoin(sessionAudioMetrics, eq(sessions.id, sessionAudioMetrics.session_id))
      .leftJoin(sessionVideoMetrics, eq(sessions.id, sessionVideoMetrics.session_id))
      .where(
        and(
          eq(sessions.tutor_id, tutorId),
          eq(sessions.status, 'completed'),
          gte(sessions.completed_at, thirtyDaysAgo)
        )
      )
      .orderBy(desc(sessions.completed_at));

    if (recentSessions.length === 0) {
      return [];
    }

    // Get existing active insights to check for patterns that no longer apply
    const existingInsights = await db
      .select()
      .from(tutorInsights)
      .where(
        and(
          eq(tutorInsights.tutor_id, tutorId),
          eq(tutorInsights.is_active, true)
        )
      );

    const detectedPatterns: InsightPattern[] = [];
    const detectedCategories = new Set<InsightCategoryType>();

    // ============================================
    // STRENGTH PATTERNS
    // ============================================

    // 1. High engagement: avg student_engagement_score > 8.0
    const engagementSessions = recentSessions.filter(s => s.student_engagement_score !== null);
    if (engagementSessions.length >= 5) {
      const avgEngagement = engagementSessions.reduce(
        (sum, s) => sum + parseFloat(s.student_engagement_score!),
        0
      ) / engagementSessions.length;

      if (avgEngagement > 8.0) {
        const samples = engagementSessions.slice(0, 3).map(s => s.session_id);
        detectedPatterns.push({
          category: 'high_engagement',
          insight_type: 'strength',
          display_text: `Consistently achieves high student engagement with an average score of ${avgEngagement.toFixed(1)}/10 across recent sessions`,
          metric_value: avgEngagement,
          sample_sessions: samples,
        });
        detectedCategories.add('high_engagement');
      }
    }

    // 2. Balanced talk ratio: tutor_talk_ratio between 0.35-0.50 in 70%+ sessions
    const talkRatioSessions = recentSessions.filter(s => s.tutor_talk_ratio !== null);
    if (talkRatioSessions.length >= 5) {
      const balancedCount = talkRatioSessions.filter(
        s => {
          const ratio = parseFloat(s.tutor_talk_ratio!);
          return ratio >= 0.35 && ratio <= 0.50;
        }
      ).length;
      const balancedPercentage = balancedCount / talkRatioSessions.length;

      if (balancedPercentage >= 0.7) {
        const samples = talkRatioSessions.slice(0, 3).map(s => s.session_id);
        detectedPatterns.push({
          category: 'balanced_talk_ratio',
          insight_type: 'strength',
          display_text: `Maintains excellent talk-time balance in ${Math.round(balancedPercentage * 100)}% of sessions, allowing strong student participation`,
          metric_value: balancedPercentage * 100,
          sample_sessions: samples,
        });
        detectedCategories.add('balanced_talk_ratio');
      }
    }

    // 3. Frequent understanding checks: avg > 8 checks per session
    const checksSessions = recentSessions.filter(s => s.tutor_checks_understanding_count !== null);
    if (checksSessions.length >= 5) {
      const avgChecks = checksSessions.reduce(
        (sum, s) => sum + s.tutor_checks_understanding_count!,
        0
      ) / checksSessions.length;

      if (avgChecks > 8) {
        const samples = checksSessions.slice(0, 3).map(s => s.session_id);
        detectedPatterns.push({
          category: 'frequent_understanding_checks',
          insight_type: 'strength',
          display_text: `Consistently checks student understanding ${avgChecks.toFixed(1)} times per session on average, ensuring comprehension`,
          metric_value: avgChecks,
          sample_sessions: samples,
        });
        detectedCategories.add('frequent_understanding_checks');
      }
    }

    // 4. Strong questioning: > 60% open-ended questions
    const questionSessions = recentSessions.filter(
      s => s.open_ended_questions !== null && s.closed_ended_questions !== null
    );
    if (questionSessions.length >= 5) {
      const totalOpen = questionSessions.reduce((sum, s) => sum + s.open_ended_questions!, 0);
      const totalClosed = questionSessions.reduce((sum, s) => sum + s.closed_ended_questions!, 0);
      const totalQuestions = totalOpen + totalClosed;

      if (totalQuestions > 0) {
        const openPercentage = (totalOpen / totalQuestions) * 100;

        if (openPercentage > 60) {
          const samples = questionSessions.slice(0, 3).map(s => s.session_id);
          detectedPatterns.push({
            category: 'strong_questioning',
            insight_type: 'strength',
            display_text: `Asks ${Math.round(openPercentage)}% open-ended questions, promoting critical thinking and deeper understanding`,
            metric_value: openPercentage,
            sample_sessions: samples,
          });
          detectedCategories.add('strong_questioning');
        }
      }
    }

    // 5. High visual aids usage: tutor_uses_visual_aids in 70%+ sessions
    const videoSessions = recentSessions.filter(s => s.tutor_uses_visual_aids !== null);
    if (videoSessions.length >= 5) {
      const visualAidsCount = videoSessions.filter(s => s.tutor_uses_visual_aids === true).length;
      const visualAidsPercentage = (visualAidsCount / videoSessions.length) * 100;

      if (visualAidsPercentage >= 70) {
        const samples = videoSessions.filter(s => s.tutor_uses_visual_aids === true)
          .slice(0, 3)
          .map(s => s.session_id);
        detectedPatterns.push({
          category: 'high_visual_aids',
          insight_type: 'strength',
          display_text: `Uses visual aids in ${Math.round(visualAidsPercentage)}% of sessions, enhancing learning through multiple modalities`,
          metric_value: visualAidsPercentage,
          sample_sessions: samples,
        });
        detectedCategories.add('high_visual_aids');
      }
    }

    // 6. Positive reinforcement: avg > 10 reinforcements per session
    const reinforcementSessions = recentSessions.filter(
      s => s.tutor_positive_reinforcement_count !== null
    );
    if (reinforcementSessions.length >= 5) {
      const avgReinforcement = reinforcementSessions.reduce(
        (sum, s) => sum + s.tutor_positive_reinforcement_count!,
        0
      ) / reinforcementSessions.length;

      if (avgReinforcement > 10) {
        const samples = reinforcementSessions.slice(0, 3).map(s => s.session_id);
        detectedPatterns.push({
          category: 'positive_reinforcement',
          insight_type: 'strength',
          display_text: `Provides frequent positive reinforcement (${avgReinforcement.toFixed(1)} times per session), building student confidence`,
          metric_value: avgReinforcement,
          sample_sessions: samples,
        });
        detectedCategories.add('positive_reinforcement');
      }
    }

    // 7. First session expert: first session convert rate > 85%
    const firstSessions = recentSessions.filter(s => s.session_number === 1);
    if (firstSessions.length >= 3) {
      // Check how many first sessions led to session 2
      const firstSessionIds = firstSessions.map(s => s.session_id);

      const followUpSessions = await db
        .select({ student_id: sessions.student_id })
        .from(sessions)
        .where(
          and(
            eq(sessions.tutor_id, tutorId),
            eq(sessions.session_number, 2),
            gte(sessions.completed_at, thirtyDaysAgo)
          )
        );

      const convertedCount = followUpSessions.length;
      const convertRate = (convertedCount / firstSessions.length) * 100;

      if (convertRate > 85) {
        const samples = firstSessions.slice(0, 3).map(s => s.session_id);
        detectedPatterns.push({
          category: 'first_session_expert',
          insight_type: 'strength',
          display_text: `Excels at first sessions with ${Math.round(convertRate)}% convert rate, creating strong first impressions`,
          metric_value: convertRate,
          sample_sessions: samples,
        });
        detectedCategories.add('first_session_expert');
      }
    }

    // ============================================
    // GROWTH AREA PATTERNS
    // ============================================

    // 1. Low engagement: avg student_engagement_score < 6.0
    if (engagementSessions.length >= 5) {
      const avgEngagement = engagementSessions.reduce(
        (sum, s) => sum + parseFloat(s.student_engagement_score!),
        0
      ) / engagementSessions.length;

      if (avgEngagement < 6.0) {
        const samples = engagementSessions.slice(0, 3).map(s => s.session_id);
        detectedPatterns.push({
          category: 'low_engagement',
          insight_type: 'growth_area',
          display_text: `Student engagement averaging ${avgEngagement.toFixed(1)}/10 - Consider incorporating more interactive activities and checking in on student interest`,
          metric_value: avgEngagement,
          sample_sessions: samples,
        });
        detectedCategories.add('low_engagement');
      }
    }

    // 2. High talk ratio: tutor_talk_ratio > 0.65 in 70%+ sessions
    if (talkRatioSessions.length >= 5) {
      const highTalkCount = talkRatioSessions.filter(
        s => parseFloat(s.tutor_talk_ratio!) > 0.65
      ).length;
      const highTalkPercentage = (highTalkCount / talkRatioSessions.length) * 100;

      if (highTalkPercentage >= 70) {
        const samples = talkRatioSessions
          .filter(s => parseFloat(s.tutor_talk_ratio!) > 0.65)
          .slice(0, 3)
          .map(s => s.session_id);
        detectedPatterns.push({
          category: 'high_talk_ratio',
          insight_type: 'growth_area',
          display_text: `Tutor speaks for more than 65% of session time in ${Math.round(highTalkPercentage)}% of sessions - Try pausing for student questions and encouraging more dialogue`,
          metric_value: highTalkPercentage,
          sample_sessions: samples,
        });
        detectedCategories.add('high_talk_ratio');
      }
    }

    // 3. Infrequent understanding checks: avg < 4 per session
    if (checksSessions.length >= 5) {
      const avgChecks = checksSessions.reduce(
        (sum, s) => sum + s.tutor_checks_understanding_count!,
        0
      ) / checksSessions.length;

      if (avgChecks < 4) {
        const samples = checksSessions.slice(0, 3).map(s => s.session_id);
        detectedPatterns.push({
          category: 'infrequent_understanding_checks',
          insight_type: 'growth_area',
          display_text: `Only ${avgChecks.toFixed(1)} understanding checks per session on average - Increase frequency of checking "Does that make sense?" and similar prompts`,
          metric_value: avgChecks,
          sample_sessions: samples,
        });
        detectedCategories.add('infrequent_understanding_checks');
      }
    }

    // 4. Low visual aids: tutor_uses_visual_aids < 30%
    if (videoSessions.length >= 5) {
      const visualAidsCount = videoSessions.filter(s => s.tutor_uses_visual_aids === true).length;
      const visualAidsPercentage = (visualAidsCount / videoSessions.length) * 100;

      if (visualAidsPercentage < 30) {
        const samples = videoSessions.slice(0, 3).map(s => s.session_id);
        detectedPatterns.push({
          category: 'low_visual_aids',
          insight_type: 'growth_area',
          display_text: `Visual aids used in only ${Math.round(visualAidsPercentage)}% of sessions - Consider using whiteboard, diagrams, or screen sharing to enhance learning`,
          metric_value: visualAidsPercentage,
          sample_sessions: samples,
        });
        detectedCategories.add('low_visual_aids');
      }
    }

    // ============================================
    // CREATE/UPDATE INSIGHTS
    // ============================================

    // Create new insights for detected patterns
    for (const pattern of detectedPatterns) {
      // Check if insight already exists
      const existingInsight = existingInsights.find(
        i => i.category === pattern.category && i.is_active
      );

      if (existingInsight) {
        // Update existing insight with new data
        const result = await db
          .update(tutorInsights)
          .set({
            display_text: pattern.display_text,
            metric_value: pattern.metric_value.toFixed(2),
            sample_sessions: pattern.sample_sessions,
            last_confirmed_at: now,
          })
          .where(eq(tutorInsights.id, existingInsight.id))
          .returning();

        if (result.length > 0) {
          const insight = result[0];
          newInsights.push({
            ...insight,
            detected_at: new Date(insight.detected_at),
            last_confirmed_at: insight.last_confirmed_at ? new Date(insight.last_confirmed_at) : null,
            resolved_at: insight.resolved_at ? new Date(insight.resolved_at) : null,
          });
        }
      } else {
        // Create new insight
        const result = await db
          .insert(tutorInsights)
          .values({
            tutor_id: tutorId,
            insight_type: pattern.insight_type,
            category: pattern.category,
            display_text: pattern.display_text,
            metric_value: pattern.metric_value.toFixed(2),
            sample_sessions: pattern.sample_sessions,
          })
          .returning();

        if (result.length > 0) {
          const insight = result[0];
          newInsights.push({
            ...insight,
            detected_at: new Date(insight.detected_at),
            last_confirmed_at: insight.last_confirmed_at ? new Date(insight.last_confirmed_at) : null,
            resolved_at: insight.resolved_at ? new Date(insight.resolved_at) : null,
          });
        }
      }
    }

    // Deactivate insights that no longer apply
    for (const existingInsight of existingInsights) {
      if (!detectedCategories.has(existingInsight.category) && existingInsight.is_active) {
        await db
          .update(tutorInsights)
          .set({
            is_active: false,
            resolved_at: now,
          })
          .where(eq(tutorInsights.id, existingInsight.id));
      }
    }

    return newInsights;
  } catch (error) {
    console.error('Error in detectAndGenerateInsights:', error);
    throw new Error('Failed to detect and generate insights: ' + (error as Error).message);
  }
}

/**
 * Resolve (deactivate) an insight
 * @param insightId - The insight ID
 * @returns Updated insight
 */
export async function resolveInsight(insightId: string): Promise<TutorInsight> {
  try {
    const result = await db
      .update(tutorInsights)
      .set({
        is_active: false,
        resolved_at: new Date(),
      })
      .where(eq(tutorInsights.id, insightId))
      .returning();

    if (result.length === 0) {
      throw new Error('Insight not found');
    }

    const insight = result[0];
    return {
      ...insight,
      detected_at: new Date(insight.detected_at),
      last_confirmed_at: insight.last_confirmed_at ? new Date(insight.last_confirmed_at) : null,
      resolved_at: insight.resolved_at ? new Date(insight.resolved_at) : null,
    };
  } catch (error) {
    console.error('Error in resolveInsight:', error);
    throw new Error('Failed to resolve insight: ' + (error as Error).message);
  }
}
