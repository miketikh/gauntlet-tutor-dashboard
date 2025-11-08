'use server';

import { db, users, tutors, students, subjects, tutorSubjects, studentSubjects } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

// Generate Firebase-like UID
function generateFirebaseUid(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  return Array.from({ length: 28 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

// Verify admin access
async function verifyAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/sign-in');
  }

  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('email', user.email)
    .single();

  if (userData?.role !== 'admin') {
    throw new Error('Unauthorized: Admin access required');
  }

  return user;
}

// Get all subjects
export async function getSubjects() {
  try {
    const allSubjects = await db.select().from(subjects).orderBy(subjects.category, subjects.name);
    return allSubjects;
  } catch (error) {
    console.error('Error fetching subjects:', error);
    return [];
  }
}

// Create user (tutor or student)
export async function createUser(formData: any) {
  try {
    // Verify admin access
    await verifyAdmin();

    // Validate required fields
    if (!formData.email || !formData.name) {
      return { success: false, error: 'Email and name are required' };
    }

    if (!formData.subjectIds || formData.subjectIds.length === 0) {
      return { success: false, error: 'At least one subject must be selected' };
    }

    // Check if email already exists
    const existingUser = await db.select().from(users).where(eq(users.email, formData.email));
    if (existingUser.length > 0) {
      return { success: false, error: 'A user with this email already exists' };
    }

    // Generate user ID
    const userId = generateFirebaseUid();

    // Create user record
    const [newUser] = await db
      .insert(users)
      .values({
        id: userId,
        email: formData.email,
        name: formData.name,
        preferred_name: formData.preferredName || null,
        avatar_url: formData.avatarUrl || null,
        role: formData.userType,
      })
      .returning();

    // Create role-specific record
    if (formData.userType === 'tutor') {
      await db.insert(tutors).values({
        user_id: userId,
        member_since: formData.memberSince || new Date().toISOString().split('T')[0],
        bio: formData.bio || null,
        experience: formData.experience || null,
        education: formData.education || null,
        teaching_style: formData.teachingStyle || null,
        hourly_rate: formData.hourlyRate ? formData.hourlyRate.toString() : null,
      });

      // Assign subjects to tutor
      if (formData.subjectIds.length > 0) {
        await db.insert(tutorSubjects).values(
          formData.subjectIds.map((subjectId: string) => ({
            tutor_id: userId,
            subject_id: subjectId,
          }))
        );
      }
    } else if (formData.userType === 'student') {
      await db.insert(students).values({
        user_id: userId,
        enrolled_since: formData.enrolledSince || new Date().toISOString().split('T')[0],
        grade_level: formData.gradeLevel || null,
        parent_email: formData.parentEmail || null,
        bio: formData.bio || null,
        learning_goals: formData.learningGoals || null,
        status: formData.status || 'active',
      });

      // Assign subjects to student
      if (formData.subjectIds.length > 0) {
        await db.insert(studentSubjects).values(
          formData.subjectIds.map((subjectId: string) => ({
            student_id: userId,
            subject_id: subjectId,
          }))
        );
      }
    }

    return {
      success: true,
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
      },
    };
  } catch (error) {
    console.error('Error creating user:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create user',
    };
  }
}

// Validate unique email
export async function validateUniqueEmail(email: string) {
  try {
    const existingUser = await db.select().from(users).where(eq(users.email, email));
    return existingUser.length === 0;
  } catch (error) {
    console.error('Error validating email:', error);
    return false;
  }
}

// ===== SESSION ACTIONS =====

// Get all tutors with session counts and their subjects
export async function getTutors() {
  try {
    await verifyAdmin();

    const { sessions: sessionsTable } = await import('@/lib/db');
    const { sql } = await import('drizzle-orm');

    // Get tutors with total session counts
    const tutorsData = await db
      .select({
        id: users.id,
        name: users.name,
        sessionCount: sql<number>`CAST(COUNT(${sessionsTable.id}) AS INTEGER)`,
      })
      .from(users)
      .innerJoin(tutors, eq(users.id, tutors.user_id))
      .leftJoin(sessionsTable, eq(users.id, sessionsTable.tutor_id))
      .where(eq(users.role, 'tutor'))
      .groupBy(users.id, users.name)
      .orderBy(users.name);

    // Get subjects for each tutor
    const tutorSubjectsData = await db
      .select({
        tutor_id: tutorSubjects.tutor_id,
        subject_id: tutorSubjects.subject_id,
        subject_name: subjects.name,
        subject_category: subjects.category,
      })
      .from(tutorSubjects)
      .innerJoin(subjects, eq(tutorSubjects.subject_id, subjects.id));

    // Combine the data
    const tutorsWithSubjects = tutorsData.map(tutor => ({
      ...tutor,
      subjects: tutorSubjectsData
        .filter(ts => ts.tutor_id === tutor.id)
        .map(ts => ({
          id: ts.subject_id,
          name: ts.subject_name,
          category: ts.subject_category,
        })),
    }));

    return tutorsWithSubjects;
  } catch (error) {
    console.error('Error fetching tutors:', error);
    return [];
  }
}

// Get all students with session counts and their subjects
export async function getStudents() {
  try {
    await verifyAdmin();

    const { sessions: sessionsTable } = await import('@/lib/db');
    const { sql } = await import('drizzle-orm');

    // Get students with total session counts
    const studentsData = await db
      .select({
        id: users.id,
        name: users.name,
        gradeLevel: students.grade_level,
        sessionCount: sql<number>`CAST(COUNT(${sessionsTable.id}) AS INTEGER)`,
      })
      .from(users)
      .innerJoin(students, eq(users.id, students.user_id))
      .leftJoin(sessionsTable, eq(users.id, sessionsTable.student_id))
      .where(eq(users.role, 'student'))
      .groupBy(users.id, users.name, students.grade_level)
      .orderBy(users.name);

    // Get subjects for each student
    const studentSubjectsData = await db
      .select({
        student_id: studentSubjects.student_id,
        subject_id: studentSubjects.subject_id,
        subject_name: subjects.name,
        subject_category: subjects.category,
      })
      .from(studentSubjects)
      .innerJoin(subjects, eq(studentSubjects.subject_id, subjects.id));

    // Combine the data
    const studentsWithSubjects = studentsData.map(student => ({
      ...student,
      subjects: studentSubjectsData
        .filter(ss => ss.student_id === student.id)
        .map(ss => ({
          id: ss.subject_id,
          name: ss.subject_name,
          category: ss.subject_category,
        })),
    }));

    return studentsWithSubjects;
  } catch (error) {
    console.error('Error fetching students:', error);
    return [];
  }
}

// Get comprehensive session data for better client-side filtering
export async function getSessionPairings() {
  try {
    await verifyAdmin();

    const { sessions: sessionsTable } = await import('@/lib/db');
    const { sql } = await import('drizzle-orm');

    // Get all tutor-student pairings with session counts
    const pairings = await db
      .select({
        tutor_id: sessionsTable.tutor_id,
        student_id: sessionsTable.student_id,
        session_count: sql<number>`CAST(COUNT(*) AS INTEGER)`,
      })
      .from(sessionsTable)
      .groupBy(sessionsTable.tutor_id, sessionsTable.student_id);

    return pairings;
  } catch (error) {
    console.error('Error fetching session pairings:', error);
    return [];
  }
}

// Get common subjects between a tutor and student
export async function getCommonSubjects(tutorId: string, studentId: string) {
  try {
    await verifyAdmin();

    // Get tutor's subjects
    const tutorSubjectsData = await db
      .select({
        id: subjects.id,
        name: subjects.name,
        category: subjects.category,
      })
      .from(tutorSubjects)
      .innerJoin(subjects, eq(tutorSubjects.subject_id, subjects.id))
      .where(eq(tutorSubjects.tutor_id, tutorId));

    // Get student's subjects
    const studentSubjectsData = await db
      .select({
        id: subjects.id,
        name: subjects.name,
        category: subjects.category,
      })
      .from(studentSubjects)
      .innerJoin(subjects, eq(studentSubjects.subject_id, subjects.id))
      .where(eq(studentSubjects.student_id, studentId));

    // Find intersection
    const tutorSubjectIds = new Set(tutorSubjectsData.map(s => s.id));
    const commonSubjectsData = studentSubjectsData.filter(s => tutorSubjectIds.has(s.id));

    return commonSubjectsData;
  } catch (error) {
    console.error('Error fetching common subjects:', error);
    return [];
  }
}

// Get tutor's subjects (fallback when no common subjects)
export async function getTutorSubjects(tutorId: string) {
  try {
    await verifyAdmin();

    const tutorSubjectsData = await db
      .select({
        id: subjects.id,
        name: subjects.name,
        category: subjects.category,
      })
      .from(tutorSubjects)
      .innerJoin(subjects, eq(tutorSubjects.subject_id, subjects.id))
      .where(eq(tutorSubjects.tutor_id, tutorId))
      .orderBy(subjects.category, subjects.name);

    return tutorSubjectsData;
  } catch (error) {
    console.error('Error fetching tutor subjects:', error);
    return [];
  }
}

// Add a subject to a student
export async function addSubjectToStudent(studentId: string, subjectId: string) {
  try {
    await verifyAdmin();

    // Check if the student already has this subject
    const { and } = await import('drizzle-orm');
    const existing = await db
      .select()
      .from(studentSubjects)
      .where(
        and(
          eq(studentSubjects.student_id, studentId),
          eq(studentSubjects.subject_id, subjectId)
        )
      );

    if (existing.length > 0) {
      return { success: true, message: 'Student already has this subject' };
    }

    // Add the subject to the student
    await db.insert(studentSubjects).values({
      student_id: studentId,
      subject_id: subjectId,
    });

    return { success: true, message: 'Subject added to student' };
  } catch (error) {
    console.error('Error adding subject to student:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to add subject'
    };
  }
}

// Get existing session count between a tutor and student
export async function getSessionCount(tutorId: string, studentId: string) {
  try {
    await verifyAdmin();

    const { sessions: sessionsTable } = await import('@/lib/db');
    const { and } = await import('drizzle-orm');

    const result = await db
      .select()
      .from(sessionsTable)
      .where(
        and(
          eq(sessionsTable.tutor_id, tutorId),
          eq(sessionsTable.student_id, studentId)
        )
      );

    return result.length;
  } catch (error) {
    console.error('Error fetching session count:', error);
    return 0;
  }
}

// Create a session with metrics
export async function createSession(formData: any) {
  try {
    await verifyAdmin();

    // Validate required fields
    if (!formData.tutorId || !formData.studentId || !formData.subjectId) {
      return { success: false, error: 'Tutor, student, and subject are required' };
    }

    const {
      sessions: sessionsTable,
      sessionAudioMetrics,
      sessionVideoMetrics,
      sessionScreenMetrics,
      sessionFeedback,
      sessionFeedbackTags,
    } = await import('@/lib/db');

    // Prepare session data
    const sessionData: any = {
      tutor_id: formData.tutorId,
      student_id: formData.studentId,
      subject_id: formData.subjectId,
      scheduled_start: new Date(formData.scheduledStart),
      scheduled_duration: formData.scheduledDuration,
      session_number: formData.sessionNumber || 1,
      status: formData.status || 'scheduled',
      tutor_showed_up: formData.status !== 'no_show_tutor',
      student_showed_up: formData.status !== 'no_show_student',
    };

    // Set actual start and duration for completed sessions
    if (formData.status === 'completed') {
      sessionData.actual_start = new Date(formData.scheduledStart);
      sessionData.actual_duration = formData.scheduledDuration;
      sessionData.completed_at = new Date(formData.scheduledStart);
      sessionData.has_audio_analysis = formData.audioMetrics ? true : false;
      sessionData.has_video_analysis = formData.videoMetrics ? true : false;
      sessionData.has_screen_monitoring = formData.screenMetrics ? true : false;
      sessionData.homework_assigned = true;
      sessionData.follow_up_booked = true;
    }

    // Calculate overall session score if we have metrics
    let overallScore = null;
    if (formData.audioMetrics) {
      overallScore = calculateOverallScore(
        formData.audioMetrics,
        formData.videoMetrics,
        formData.screenMetrics
      );
      sessionData.overall_session_score = overallScore.toString();
    }

    // Create session
    const [newSession] = await db
      .insert(sessionsTable)
      .values(sessionData)
      .returning();

    // Create audio metrics if provided
    if (formData.audioMetrics) {
      await db.insert(sessionAudioMetrics).values({
        session_id: newSession.id,
        tutor_talk_ratio: formData.audioMetrics.tutorTalkRatio.toString(),
        student_talk_ratio: formData.audioMetrics.studentTalkRatio.toString(),
        productive_silence_ratio: formData.audioMetrics.productiveSilenceRatio.toString(),
        awkward_pause_ratio: formData.audioMetrics.awkwardPauseRatio.toString(),
        student_engagement_score: formData.audioMetrics.studentEngagementScore.toString(),
        tutor_enthusiasm_score: formData.audioMetrics.tutorEnthusiasmScore.toString(),
        avg_student_response_delay: formData.audioMetrics.avgStudentResponseDelay.toString(),
        long_pauses_count: formData.audioMetrics.longPausesCount,
        student_initiated_questions: formData.audioMetrics.studentInitiatedQuestions,
        student_frustration_count: formData.audioMetrics.studentFrustrationCount,
        student_confusion_count: formData.audioMetrics.studentConfusionCount,
        positive_moments_count: formData.audioMetrics.positiveMomentsCount,
        tutor_checks_understanding_count: formData.audioMetrics.tutorChecksUnderstandingCount,
        tutor_positive_reinforcement_count: formData.audioMetrics.tutorPositiveReinforcementCount,
        concept_re_explanation_count: formData.audioMetrics.conceptReExplanationCount,
        open_ended_questions: formData.audioMetrics.openEndedQuestions,
        closed_ended_questions: formData.audioMetrics.closedEndedQuestions,
        rhetorical_questions: formData.audioMetrics.rhetoricalQuestions,
      });
    }

    // Create video metrics if provided
    if (formData.videoMetrics) {
      await db.insert(sessionVideoMetrics).values({
        session_id: newSession.id,
        student_on_screen_attention_pct: formData.videoMetrics.studentOnScreenAttentionPct.toString(),
        student_visual_engagement_score: formData.videoMetrics.studentVisualEngagementScore.toString(),
        distraction_events_count: formData.videoMetrics.distractionEventsCount,
        confusion_moments_count: formData.videoMetrics.confusionMomentsCount,
        tutor_uses_visual_aids: formData.videoMetrics.tutorUsesVisualAids,
        student_taking_notes_duration: formData.videoMetrics.studentTakingNotesDuration,
      });
    }

    // Create screen metrics if provided
    if (formData.screenMetrics) {
      await db.insert(sessionScreenMetrics).values({
        session_id: newSession.id,
        active_tab_focus_pct: formData.screenMetrics.activeTabFocusPct.toString(),
        tab_switches_count: formData.screenMetrics.tabSwitchesCount,
        whiteboard_usage_minutes: formData.screenMetrics.whiteboardUsageMinutes,
        messaging_app_detected: formData.screenMetrics.messagingAppDetected,
        gaming_detected: formData.screenMetrics.gamingDetected,
      });
    }

    // Create feedback if provided
    if (formData.feedback) {
      await db.insert(sessionFeedback).values({
        session_id: newSession.id,
        student_satisfaction_rating: formData.feedback.studentSatisfactionRating,
        feedback_text: formData.feedback.feedbackText || null,
      });

      // Create feedback tags
      if (formData.feedback.tags && formData.feedback.tags.length > 0) {
        await db.insert(sessionFeedbackTags).values(
          formData.feedback.tags.map((tag: string) => ({
            session_id: newSession.id,
            tag: tag,
          }))
        );
      }
    }

    return {
      success: true,
      session: {
        id: newSession.id,
        sessionNumber: newSession.session_number,
        status: newSession.status,
        scheduledStart: newSession.scheduled_start,
        scheduledDuration: newSession.scheduled_duration,
        overallScore: overallScore,
        hasAudioMetrics: !!formData.audioMetrics,
        hasVideoMetrics: !!formData.videoMetrics,
        hasScreenMetrics: !!formData.screenMetrics,
        hasFeedback: !!formData.feedback,
      },
    };
  } catch (error) {
    console.error('Error creating session:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create session',
    };
  }
}

// Calculate overall session score based on metrics
function calculateOverallScore(
  audioMetrics: any,
  videoMetrics?: any,
  screenMetrics?: any
): number {
  let score = 5.0; // Base score

  // Audio metrics contributions (primary weight)
  score += (audioMetrics.studentEngagementScore - 5) * 0.3;
  score += (audioMetrics.tutorEnthusiasmScore - 5) * 0.2;

  // Talk ratio balance
  if (audioMetrics.tutorTalkRatio >= 0.4 && audioMetrics.tutorTalkRatio <= 0.5) {
    score += 1.0;
  } else if (audioMetrics.tutorTalkRatio > 0.7) {
    score -= 2.0;
  }

  // Understanding checks
  if (audioMetrics.tutorChecksUnderstandingCount >= 8) {
    score += 1.0;
  } else if (audioMetrics.tutorChecksUnderstandingCount < 3) {
    score -= 1.5;
  }

  // Negative factors
  score -= audioMetrics.studentFrustrationCount * 0.3;
  score -= audioMetrics.studentConfusionCount * 0.15;

  // Positive factors
  score += Math.min(audioMetrics.studentInitiatedQuestions * 0.1, 1.0);
  score += Math.min(audioMetrics.tutorPositiveReinforcementCount * 0.05, 0.5);

  // Video metrics contributions (if available)
  if (videoMetrics) {
    if (videoMetrics.studentOnScreenAttentionPct > 0.8) {
      score += 0.5;
    } else if (videoMetrics.studentOnScreenAttentionPct < 0.5) {
      score -= 1.0;
    }

    if (videoMetrics.studentTakingNotesDuration > 15) {
      score += 0.3;
    }

    score -= videoMetrics.distractionEventsCount * 0.1;
  }

  // Screen metrics contributions (if available)
  if (screenMetrics) {
    if (screenMetrics.activeTabFocusPct < 0.7) {
      score -= 0.5;
    }

    if (screenMetrics.whiteboardUsageMinutes > 20) {
      score += 0.3;
    }

    if (screenMetrics.gamingDetected) {
      score -= 3.0;
    } else if (screenMetrics.messagingAppDetected) {
      score -= 1.0;
    }
  }

  // Normalize to 0-10 range
  return Math.max(0, Math.min(10, score));
}
