#!/usr/bin/env tsx
// Script to repair NULL session scores in existing data

import { db } from '../lib/db';
import { sessions, sessionAudioMetrics, sessionVideoMetrics, sessionScreenMetrics, users } from '../lib/db';
import { eq, and, isNull } from 'drizzle-orm';
import { createSeededRandom } from './seed/utils/random';
import { MetricsGenerator } from './seed/generators/metrics';
import { SessionFactory } from './seed/factories/sessionFactory';

async function repairScores() {
  console.log('🔧 Starting score repair process...\n');

  try {
    // Initialize generators with a consistent seed
    const random = createSeededRandom(42);
    const metricsGen = new MetricsGenerator(random);
    const sessionFactory = new SessionFactory(random);

    // Find all completed sessions with NULL scores
    const sessionsToFix = await db.select({
      id: sessions.id,
      tutor_id: sessions.tutor_id,
      student_id: sessions.student_id,
      session_number: sessions.session_number,
      has_audio_analysis: sessions.has_audio_analysis,
      has_video_analysis: sessions.has_video_analysis,
      has_screen_monitoring: sessions.has_screen_monitoring,
      overall_session_score: sessions.overall_session_score,
      technical_issues: sessions.technical_issues,
      homework_assigned: sessions.homework_assigned,
      follow_up_booked: sessions.follow_up_booked,
    })
    .from(sessions)
    .where(
      and(
        eq(sessions.status, 'completed'),
        isNull(sessions.overall_session_score)
      )
    );

    console.log(`Found ${sessionsToFix.length} sessions with NULL scores to repair\n`);

    if (sessionsToFix.length === 0) {
      console.log('No sessions need repair!');
      process.exit(0);
    }

    let fixedCount = 0;
    let errorCount = 0;

    for (const session of sessionsToFix) {
      try {
        // Get audio metrics (should already exist)
        const [audioMetricsData] = await db.select()
          .from(sessionAudioMetrics)
          .where(eq(sessionAudioMetrics.session_id, session.id));

        if (!audioMetricsData) {
          console.log(`⚠️  No audio metrics found for session ${session.id}, skipping...`);
          errorCount++;
          continue;
        }

        // Get video metrics if they exist
        let videoMetricsData = null;
        if (session.has_video_analysis) {
          const [videoData] = await db.select()
            .from(sessionVideoMetrics)
            .where(eq(sessionVideoMetrics.session_id, session.id));
          videoMetricsData = videoData || null;
        }

        // Get screen metrics if they exist
        let screenMetricsData = null;
        if (session.has_screen_monitoring) {
          const [screenData] = await db.select()
            .from(sessionScreenMetrics)
            .where(eq(sessionScreenMetrics.session_id, session.id));
          screenMetricsData = screenData || null;
        }

        // Convert database metrics to generator format
        const audioMetrics = {
          sessionId: session.id,
          tutorTalkRatio: parseFloat(audioMetricsData.tutor_talk_ratio || '0'),
          studentTalkRatio: parseFloat(audioMetricsData.student_talk_ratio || '0'),
          productiveSilenceRatio: parseFloat(audioMetricsData.productive_silence_ratio || '0'),
          awkwardPauseRatio: parseFloat(audioMetricsData.awkward_pause_ratio || '0'),
          studentEngagementScore: parseFloat(audioMetricsData.student_engagement_score || '0'),
          tutorEnthusiasmScore: parseFloat(audioMetricsData.tutor_enthusiasm_score || '0'),
          avgStudentResponseDelay: parseFloat(audioMetricsData.avg_student_response_delay || '0'),
          longPausesCount: audioMetricsData.long_pauses_count,
          studentInitiatedQuestions: audioMetricsData.student_initiated_questions,
          studentFrustrationCount: audioMetricsData.student_frustration_count,
          studentConfusionCount: audioMetricsData.student_confusion_count,
          positiveMomentsCount: audioMetricsData.positive_moments_count,
          tutorChecksUnderstandingCount: audioMetricsData.tutor_checks_understanding_count,
          tutorPositiveReinforcementCount: audioMetricsData.tutor_positive_reinforcement_count,
          conceptReExplanationCount: audioMetricsData.concept_re_explanation_count,
          openEndedQuestions: audioMetricsData.open_ended_questions,
          closedEndedQuestions: audioMetricsData.closed_ended_questions,
          rhetoricalQuestions: audioMetricsData.rhetorical_questions,
        };

        const videoMetrics = videoMetricsData ? {
          sessionId: session.id,
          studentOnScreenAttentionPct: parseFloat(videoMetricsData.student_on_screen_attention_pct || '0'),
          studentVisualEngagementScore: parseFloat(videoMetricsData.student_visual_engagement_score || '0'),
          distractionEventsCount: videoMetricsData.distraction_events_count,
          confusionMomentsCount: videoMetricsData.confusion_moments_count,
          tutorUsesVisualAids: videoMetricsData.tutor_uses_visual_aids,
          studentTakingNotesDuration: videoMetricsData.student_taking_notes_duration,
        } : null;

        const screenMetrics = screenMetricsData ? {
          sessionId: session.id,
          activeTabFocusPct: parseFloat(screenMetricsData.active_tab_focus_pct || '0'),
          tabSwitchesCount: screenMetricsData.tab_switches_count,
          whiteboardUsageMinutes: screenMetricsData.whiteboard_usage_minutes,
          messagingAppDetected: screenMetricsData.messaging_app_detected,
          gamingDetected: screenMetricsData.gaming_detected,
        } : null;

        // Calculate overall score using the same logic as the seed script
        const overallScore = metricsGen.calculateOverallScore(
          audioMetrics,
          videoMetrics,
          screenMetrics
        );

        // Generate AI summary (simplified version for repair)
        const aiSummary = generateSimpleAiSummary(overallScore, session);

        // Update the session with the calculated score
        await db.update(sessions)
          .set({
            overall_session_score: overallScore.toString(),
            ai_summary: aiSummary,
          })
          .where(eq(sessions.id, session.id));

        fixedCount++;
        console.log(`✅ Fixed session ${session.id.substring(0, 8)}... Score: ${overallScore.toFixed(1)}`);
      } catch (error) {
        console.error(`❌ Error fixing session ${session.id}:`, error);
        errorCount++;
      }
    }

    console.log(`\n🎉 Repair complete!`);
    console.log(`   ✅ Fixed: ${fixedCount} sessions`);
    if (errorCount > 0) {
      console.log(`   ❌ Errors: ${errorCount} sessions`);
    }

    // Verify the fix by checking for remaining NULL scores
    const remainingNulls = await db.select({
      count: sessions.id,
    })
    .from(sessions)
    .where(
      and(
        eq(sessions.status, 'completed'),
        isNull(sessions.overall_session_score)
      )
    );

    console.log(`\n📊 Remaining NULL scores: ${remainingNulls.length}`);

  } catch (error) {
    console.error('Fatal error during repair:', error);
    process.exit(1);
  }

  process.exit(0);
}

// Simple AI summary generator for repair purposes
function generateSimpleAiSummary(score: number, session: any): string {
  const summaries = {
    excellent: [
      'Excellent session with high engagement. Student demonstrated strong understanding of concepts.',
      'Very productive session. Student actively participated and asked insightful questions.',
      'Outstanding progress made. Student showed clear mastery of the material.',
    ],
    good: [
      'Good session overall. Student grasped most concepts with some areas needing reinforcement.',
      'Solid progress made. Student engaged well with occasional clarification needed.',
      'Productive session with steady improvement observed throughout.',
    ],
    needsImprovement: [
      'Session had challenges. Student struggled with key concepts and needs additional support.',
      'Mixed results. Some progress made but significant gaps in understanding remain.',
      'Difficult session. Student showed signs of frustration and disengagement.',
    ],
  };

  let category: keyof typeof summaries;
  if (score >= 8) category = 'excellent';
  else if (score >= 6) category = 'good';
  else category = 'needsImprovement';

  // Pick first summary for consistency
  const baseSummary = summaries[category][0];

  const details = [];
  if (session.session_number === 1) {
    details.push('First session establishing baseline understanding.');
  }
  if (session.technical_issues) {
    details.push('Some technical difficulties affected session flow.');
  }
  if (session.homework_assigned) {
    details.push('Homework assigned to reinforce concepts.');
  }
  if (session.follow_up_booked) {
    details.push('Follow-up session scheduled to continue progress.');
  }

  return details.length > 0
    ? `${baseSummary} ${details.join(' ')}`
    : baseSummary;
}

// Run the repair
repairScores();