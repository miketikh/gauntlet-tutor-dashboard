#!/usr/bin/env tsx
// Main seed data orchestrator

import { drizzle } from 'drizzle-orm/postgres-js';
import { eq } from 'drizzle-orm';
import postgres from 'postgres';
import { config } from 'dotenv';
import { createSeededRandom } from './utils/random';
import { DateGenerator, distributeTutoringLoad } from './utils/dates';
import { UserGenerator } from './generators/users';
import { SessionFactory } from './factories/sessionFactory';
import { MetricsGenerator } from './generators/metrics';
import { FeedbackGenerator } from './generators/feedback';

// Import schema tables
import { users, subjects } from '../../lib/db/schema/users';
import { tutors, tutorSubjects, tutorPerformanceSnapshots, tutorInsights } from '../../lib/db/schema/tutors';
import { students, studentSubjects, studentChurnReasons } from '../../lib/db/schema/students';
import { sessions } from '../../lib/db/schema/sessions';
import {
  sessionAudioMetrics,
  sessionVideoMetrics,
  sessionScreenMetrics,
  sessionFeedback,
  sessionFeedbackTags,
  sessionTranscriptHighlights
} from '../../lib/db/schema/metrics';
import { alerts, achievements } from '../../lib/db/schema/alerts';
import { churnAlgorithmWeights } from '../../lib/db/schema/churn';

// Load environment variables
config({ path: '.env.local' });

// Configuration
const SEED_VALUE = 42; // For reproducible generation
const TOTAL_SESSIONS = 150; // Number of sessions to generate
const CLEAR_EXISTING_DATA = true; // Whether to clear existing data

// Subject definitions
const SUBJECTS_DATA = [
  // Math
  { name: 'Algebra', category: 'math' as const },
  { name: 'Geometry', category: 'math' as const },
  { name: 'Calculus', category: 'math' as const },
  { name: 'Pre-Calculus', category: 'math' as const },
  { name: 'Statistics', category: 'math' as const },
  { name: 'Basic Math', category: 'math' as const },
  // Science
  { name: 'Physics', category: 'science' as const },
  { name: 'Chemistry', category: 'science' as const },
  { name: 'Biology', category: 'science' as const },
  { name: 'Earth Science', category: 'science' as const },
  // Language Arts
  { name: 'English Literature', category: 'language_arts' as const },
  { name: 'Writing', category: 'language_arts' as const },
  { name: 'Reading Comprehension', category: 'language_arts' as const },
  // Other
  { name: 'SAT Prep', category: 'test_prep' as const },
  { name: 'ACT Prep', category: 'test_prep' as const },
  { name: 'Computer Science', category: 'computer_science' as const },
  { name: 'Spanish', category: 'foreign_language' as const },
  { name: 'French', category: 'foreign_language' as const },
];

async function seed() {
  console.log('🌱 Starting seed data generation...\n');

  // Initialize database connection
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set in environment variables');
  }

  const sql = postgres(connectionString);
  const db = drizzle(sql);

  // Initialize generators
  const random = createSeededRandom(SEED_VALUE);
  const dateGen = new DateGenerator(random);
  const userGen = new UserGenerator(random);
  const sessionFactory = new SessionFactory(random);
  const metricsGen = new MetricsGenerator(random);
  const feedbackGen = new FeedbackGenerator(random);

  try {
    // Phase 1: Clear existing data if requested
    if (CLEAR_EXISTING_DATA) {
      console.log('🧹 Clearing existing data...');
      await db.delete(churnAlgorithmWeights);
      await db.delete(achievements);
      await db.delete(alerts);
      await db.delete(sessionTranscriptHighlights);
      await db.delete(sessionFeedbackTags);
      await db.delete(sessionFeedback);
      await db.delete(sessionScreenMetrics);
      await db.delete(sessionVideoMetrics);
      await db.delete(sessionAudioMetrics);
      await db.delete(sessions);
      await db.delete(studentChurnReasons);
      await db.delete(studentSubjects);
      await db.delete(students);
      await db.delete(tutorInsights);
      await db.delete(tutorPerformanceSnapshots);
      await db.delete(tutorSubjects);
      await db.delete(tutors);
      await db.delete(users);
      await db.delete(subjects);
      console.log('✅ Existing data cleared\n');
    }

    // Phase 2: Create subjects
    console.log('📚 Creating subjects...');
    const insertedSubjects = await db.insert(subjects).values(SUBJECTS_DATA).returning();
    const subjectMap = new Map(insertedSubjects.map(s => [s.name, s.id]));
    console.log(`✅ Created ${insertedSubjects.length} subjects\n`);

    // Phase 3: Create users
    console.log('👥 Creating users...');

    // Create admin
    const adminUser = userGen.generateAdmin();
    await db.insert(users).values(adminUser);
    console.log('✅ Created admin user');

    // Create tutors
    const { users: tutorUsers, tutors: tutorData } = userGen.generateTutors();
    await db.insert(users).values(tutorUsers);
    for (const tutor of tutorData) {
      await db.insert(tutors).values({
        user_id: tutor.userId,
        member_since: tutor.memberSince.toISOString().split('T')[0],
        bio: tutor.bio,
        experience: tutor.experience,
        education: tutor.education,
        teaching_style: tutor.teachingStyle,
        hourly_rate: tutor.hourlyRate.toString(),
      });
    }
    console.log(`✅ Created ${tutorUsers.length} tutors`);

    // Create students
    const { users: studentUsers, students: studentData } = userGen.generateStudents();
    await db.insert(users).values(studentUsers);
    for (const student of studentData) {
      await db.insert(students).values({
        user_id: student.userId,
        enrolled_since: student.enrolledSince.toISOString().split('T')[0],
        grade_level: student.gradeLevel as any,
        parent_email: student.parentEmail,
        bio: student.bio,
        learning_goals: student.learningGoals,
        status: student.status,
      });
    }
    console.log(`✅ Created ${studentUsers.length} students\n`);

    // Phase 4: Assign subjects to tutors and students
    console.log('🔗 Assigning subjects...');
    const subjectIds = Array.from(subjectMap.values());

    // Assign subjects to tutors
    const tutorSubjectAssignments = userGen.generateSubjectAssignments(
      tutorUsers.map(t => t.id),
      subjectIds,
      'tutor'
    );
    for (const assignment of tutorSubjectAssignments) {
      await db.insert(tutorSubjects).values({
        tutor_id: assignment.userId,
        subject_id: assignment.subjectId,
      });
    }

    // Assign subjects to students
    const studentSubjectAssignments = userGen.generateSubjectAssignments(
      studentUsers.map(s => s.id),
      subjectIds,
      'student'
    );
    for (const assignment of studentSubjectAssignments) {
      await db.insert(studentSubjects).values({
        student_id: assignment.userId,
        subject_id: assignment.subjectId,
      });
    }
    console.log('✅ Subject assignments complete\n');

    // Phase 5: Generate sessions
    console.log(`📅 Generating ${TOTAL_SESSIONS} sessions...`);

    // Create tutor quality map for distribution
    const tutorQualities = new Map<string, 'star' | 'solid' | 'struggling' | 'atRisk'>();
    tutorData.forEach(t => {
      tutorQualities.set(t.userId, t.persona as any);
    });

    // Distribute sessions across tutors
    const sessionDistribution = distributeTutoringLoad(
      tutorUsers.map(t => t.id),
      tutorQualities,
      TOTAL_SESSIONS
    );

    const allSessions = [];
    let sessionCount = 0;

    for (const [tutorId, sessionTarget] of sessionDistribution) {
      const tutor = tutorData.find(t => t.userId === tutorId)!;

      // Assign students to this tutor (some repeat, some one-off)
      const assignedStudents = random.pickMultiple(
        studentData,
        Math.min(Math.ceil(sessionTarget / 3), studentData.length)
      );

      let tutorSessionCount = 0;
      for (const student of assignedStudents) {
        if (tutorSessionCount >= sessionTarget) break;

        // Number of sessions with this student (1-6)
        const sessionsWithStudent = Math.min(
          random.int(1, 6),
          sessionTarget - tutorSessionCount
        );

        // Get a common subject between tutor and student
        const tutorSubjectIds = tutorSubjectAssignments
          .filter(a => a.userId === tutorId)
          .map(a => a.subjectId);
        const studentSubjectIds = studentSubjectAssignments
          .filter(a => a.userId === student.userId)
          .map(a => a.subjectId);
        const commonSubjects = tutorSubjectIds.filter(id =>
          studentSubjectIds.includes(id)
        );

        if (commonSubjects.length === 0) continue;

        const subjectId = random.pick(commonSubjects);
        const subjectName = Array.from(subjectMap.entries())
          .find(([_, id]) => id === subjectId)?.[0] || 'Unknown';

        // Generate session times
        const sessionDates = dateGen.sessionSeries(sessionsWithStudent);

        for (const sessionDate of sessionDates) {
          const session = sessionFactory.createSession(
            tutor,
            student,
            subjectId,
            subjectName,
            sessionDate,
            tutorSessionCount
          );

          allSessions.push(session);
          tutorSessionCount++;
          sessionCount++;

          if (sessionCount >= TOTAL_SESSIONS) break;
        }

        if (sessionCount >= TOTAL_SESSIONS) break;
      }
    }

    console.log(`✅ Generated ${allSessions.length} sessions\n`);

    // Phase 6: Insert sessions and generate metrics (with ~50% video, ~40% screen monitoring)
    console.log('💾 Saving sessions and metrics...');
    let completedSessions = 0;
    let feedbackCount = 0;
    let highlightCount = 0;

    for (const sessionData of allSessions) {
      // Insert session
      const [insertedSession] = await db.insert(sessions).values({
        tutor_id: sessionData.tutorId,
        student_id: sessionData.studentId,
        scheduled_start: sessionData.scheduledStart,
        actual_start: sessionData.actualStart,
        scheduled_duration: sessionData.scheduledDuration,
        actual_duration: sessionData.actualDuration,
        subject_id: sessionData.subjectId,
        session_number: sessionData.sessionNumber,
        status: sessionData.status,
        tutor_showed_up: sessionData.tutorShowedUp,
        student_showed_up: sessionData.studentShowedUp,
        rescheduled_by: sessionData.rescheduledBy,
        technical_issues: sessionData.technicalIssues,
        technical_issues_description: sessionData.technicalIssuesDescription,
        has_audio_analysis: sessionData.hasAudioAnalysis,
        has_video_analysis: sessionData.hasVideoAnalysis,
        has_screen_monitoring: sessionData.hasScreenMonitoring,
        homework_assigned: sessionData.homeworkAssigned,
        follow_up_booked: sessionData.followUpBooked,
        completed_at: sessionData.completedAt,
      }).returning();

      sessionData.id = insertedSession.id;

      // Generate metrics for completed sessions
      if (sessionData.status === 'completed') {
        completedSessions++;

        // Audio metrics (always present)
        const audioMetrics = metricsGen.generateAudioMetrics(sessionData);
        audioMetrics.sessionId = insertedSession.id;

        await db.insert(sessionAudioMetrics).values({
          session_id: audioMetrics.sessionId,
          tutor_talk_ratio: audioMetrics.tutorTalkRatio.toString(),
          student_talk_ratio: audioMetrics.studentTalkRatio.toString(),
          productive_silence_ratio: audioMetrics.productiveSilenceRatio.toString(),
          awkward_pause_ratio: audioMetrics.awkwardPauseRatio.toString(),
          student_engagement_score: audioMetrics.studentEngagementScore.toString(),
          tutor_enthusiasm_score: audioMetrics.tutorEnthusiasmScore.toString(),
          avg_student_response_delay: audioMetrics.avgStudentResponseDelay.toString(),
          long_pauses_count: audioMetrics.longPausesCount,
          student_initiated_questions: audioMetrics.studentInitiatedQuestions,
          student_frustration_count: audioMetrics.studentFrustrationCount,
          student_confusion_count: audioMetrics.studentConfusionCount,
          positive_moments_count: audioMetrics.positiveMomentsCount,
          tutor_checks_understanding_count: audioMetrics.tutorChecksUnderstandingCount,
          tutor_positive_reinforcement_count: audioMetrics.tutorPositiveReinforcementCount,
          concept_re_explanation_count: audioMetrics.conceptReExplanationCount,
          open_ended_questions: audioMetrics.openEndedQuestions,
          closed_ended_questions: audioMetrics.closedEndedQuestions,
          rhetorical_questions: audioMetrics.rhetoricalQuestions,
        });

        // Video metrics (optional)
        const videoMetrics = metricsGen.generateVideoMetrics(sessionData);
        if (videoMetrics) {
          videoMetrics.sessionId = insertedSession.id;
          await db.insert(sessionVideoMetrics).values({
            session_id: videoMetrics.sessionId,
            student_on_screen_attention_pct: videoMetrics.studentOnScreenAttentionPct.toString(),
            student_visual_engagement_score: videoMetrics.studentVisualEngagementScore.toString(),
            distraction_events_count: videoMetrics.distractionEventsCount,
            confusion_moments_count: videoMetrics.confusionMomentsCount,
            tutor_uses_visual_aids: videoMetrics.tutorUsesVisualAids,
            student_taking_notes_duration: videoMetrics.studentTakingNotesDuration,
          });
        }

        // Screen metrics (optional)
        const screenMetrics = metricsGen.generateScreenMetrics(sessionData);
        if (screenMetrics) {
          screenMetrics.sessionId = insertedSession.id;
          await db.insert(sessionScreenMetrics).values({
            session_id: screenMetrics.sessionId,
            active_tab_focus_pct: screenMetrics.activeTabFocusPct.toString(),
            tab_switches_count: screenMetrics.tabSwitchesCount,
            whiteboard_usage_minutes: screenMetrics.whiteboardUsageMinutes,
            messaging_app_detected: screenMetrics.messagingAppDetected,
            gaming_detected: screenMetrics.gamingDetected,
          });
        }

        // Calculate and update overall score
        const overallScore = metricsGen.calculateOverallScore(
          audioMetrics,
          videoMetrics,
          screenMetrics
        );

        await db.update(sessions)
          .set({
            overall_session_score: overallScore.toString(),
            ai_summary: sessionFactory.generateAiSummary(sessionData, audioMetrics),
          })
          .where(eq(sessions.id, insertedSession.id));

        // Generate feedback (60% chance)
        const feedback = feedbackGen.generateFeedback(
          sessionData,
          audioMetrics,
          overallScore
        );

        if (feedback) {
          feedback.sessionId = insertedSession.id;
          feedbackCount++;

          await db.insert(sessionFeedback).values({
            session_id: feedback.sessionId,
            student_satisfaction_rating: feedback.studentSatisfactionRating,
            feedback_text: feedback.feedbackText,
          });

          // Insert feedback tags
          for (const tag of feedback.tags) {
            await db.insert(sessionFeedbackTags).values({
              session_id: feedback.sessionId,
              tag: tag as any,
            });
          }
        }

        // Generate transcript highlights
        const highlights = feedbackGen.generateTranscriptHighlights(
          sessionData,
          audioMetrics
        );

        for (const highlight of highlights) {
          highlight.sessionId = insertedSession.id;
          highlightCount++;

          await db.insert(sessionTranscriptHighlights).values({
            session_id: highlight.sessionId,
            timestamp_seconds: highlight.timestampSeconds,
            speaker: highlight.speaker as any,
            text: highlight.text,
            highlight_type: highlight.highlightType as any,
          });
        }
      }
    }

    console.log(`✅ Saved ${completedSessions} completed sessions with metrics`);
    console.log(`✅ Generated ${feedbackCount} feedback entries`);
    console.log(`✅ Generated ${highlightCount} transcript highlights\n`);

    // Phase 7: Generate initial churn algorithm weights
    console.log('⚖️ Creating churn algorithm weights...');
    const initialWeights = [
      { factor: 'first_session_satisfaction', weight: 0.25 },
      { factor: 'sessions_completed', weight: 0.15 },
      { factor: 'follow_up_booking_rate', weight: 0.20 },
      { factor: 'avg_session_score', weight: 0.15 },
      { factor: 'tutor_consistency', weight: 0.10 },
      { factor: 'student_engagement', weight: 0.15 },
    ];

    for (const weight of initialWeights) {
      await db.insert(churnAlgorithmWeights).values({
        version: 1,
        factor_category: weight.factor,
        weight: weight.weight.toString(),
        notes: 'Initial seed weights',
      });
    }
    console.log('✅ Created initial churn algorithm weights\n');

    console.log('🎉 Seed data generation complete!\n');
    console.log('Summary:');
    console.log(`  - ${tutorUsers.length} tutors`);
    console.log(`  - ${studentUsers.length} students`);
    console.log(`  - ${insertedSubjects.length} subjects`);
    console.log(`  - ${allSessions.length} total sessions`);
    console.log(`  - ${completedSessions} completed sessions`);
    console.log(`  - ${feedbackCount} feedback entries`);
    console.log(`  - ${highlightCount} transcript highlights`);

  } catch (error) {
    console.error('❌ Error during seed:', error);
    throw error;
  } finally {
    await sql.end();
  }
}

// Run seed if executed directly
if (require.main === module) {
  seed().catch(console.error);
}

export default seed;