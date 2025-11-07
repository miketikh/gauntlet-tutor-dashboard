// Session data factory with trait generation

import { SeededRandom } from '../utils/random';
import { DateGenerator } from '../utils/dates';
import { sessionTraitProbabilities, subjectComplexity } from '../config/probabilities';
import type { GeneratedTutor, GeneratedStudent } from '../generators/users';

export interface SessionData {
  id?: string;
  tutorId: string;
  studentId: string;
  scheduledStart: Date;
  actualStart: Date | null;
  scheduledDuration: number;
  actualDuration: number | null;
  subjectId: string;
  subjectName?: string;
  sessionNumber: number;
  status: 'scheduled' | 'in_progress' | 'completed' | 'no_show_tutor' | 'no_show_student' | 'cancelled' | 'rescheduled';
  tutorShowedUp: boolean;
  studentShowedUp: boolean;
  rescheduledBy?: 'tutor' | 'student';
  technicalIssues: boolean;
  technicalIssuesDescription?: string;
  hasAudioAnalysis: boolean;
  hasVideoAnalysis: boolean;
  hasScreenMonitoring: boolean;
  homeworkAssigned: boolean;
  followUpBooked: boolean;
  overallSessionScore?: number;
  aiSummary?: string;
  completedAt: Date | null;
  createdAt: Date;

  // Metadata for generation
  _meta: {
    tutorPersona: string;
    studentPersona: string;
    isFirstSession: boolean;
    tutorTraits: any;
    studentTraits: any;
  };
}

export class SessionFactory {
  private random: SeededRandom;
  private dateGen: DateGenerator;
  private sessionCounters: Map<string, number> = new Map();

  constructor(random: SeededRandom) {
    this.random = random;
    this.dateGen = new DateGenerator(random);
  }

  // Get or increment session number for a tutor-student pair
  private getSessionNumber(tutorId: string, studentId: string): number {
    const key = `${tutorId}-${studentId}`;
    const current = this.sessionCounters.get(key) || 0;
    const next = current + 1;
    this.sessionCounters.set(key, next);
    return next;
  }

  // Create a single session
  createSession(
    tutor: GeneratedTutor,
    student: GeneratedStudent,
    subjectId: string,
    subjectName: string,
    scheduledStart: Date,
    existingSessions: number = 0
  ): SessionData {
    const sessionNumber = this.getSessionNumber(tutor.userId, student.userId);
    const isFirstSession = sessionNumber === 1;

    // Determine session status based on personas and probabilities
    const status = this.determineSessionStatus(
      tutor.traits,
      student.traits,
      isFirstSession
    );

    const scheduledDuration = this.dateGen.sessionDuration();
    const technicalIssues = this.determineTechnicalIssues(scheduledStart);

    let actualStart: Date | null = null;
    let actualDuration: number | null = null;
    let completedAt: Date | null = null;

    if (status === 'completed') {
      // Add slight delay to start time (0-5 minutes)
      actualStart = new Date(scheduledStart);
      actualStart.setMinutes(actualStart.getMinutes() + this.random.int(0, 5));

      actualDuration = this.dateGen.actualDuration(scheduledDuration, technicalIssues);
      completedAt = this.dateGen.completedAt(actualStart, actualDuration!);
    }

    // Determine which analysis types are available
    const hasAudioAnalysis = status === 'completed'; // Always for completed sessions
    const hasVideoAnalysis = status === 'completed' && this.determineVideoAvailability(technicalIssues);
    const hasScreenMonitoring = status === 'completed' && this.determineScreenAvailability(technicalIssues);

    // Session outcomes based on quality (will be refined after metrics generation)
    const sessionQuality = this.estimateSessionQuality(tutor.traits, student.traits, isFirstSession);
    const homeworkAssigned = this.determineHomeworkAssigned(status, sessionQuality);
    const followUpBooked = this.determineFollowUpBooked(status, sessionQuality, isFirstSession);

    return {
      tutorId: tutor.userId,
      studentId: student.userId,
      scheduledStart,
      actualStart,
      scheduledDuration,
      actualDuration,
      subjectId,
      subjectName,
      sessionNumber,
      status,
      tutorShowedUp: status !== 'no_show_tutor',
      studentShowedUp: status !== 'no_show_student',
      rescheduledBy: status === 'rescheduled' ? this.random.pick(['tutor', 'student']) : undefined,
      technicalIssues,
      technicalIssuesDescription: technicalIssues ? this.generateTechnicalDescription() : undefined,
      hasAudioAnalysis,
      hasVideoAnalysis,
      hasScreenMonitoring,
      homeworkAssigned,
      followUpBooked,
      completedAt,
      createdAt: scheduledStart,
      _meta: {
        tutorPersona: tutor.persona,
        studentPersona: student.persona,
        isFirstSession,
        tutorTraits: tutor.traits,
        studentTraits: student.traits,
      },
    };
  }

  // Determine session status based on personas
  private determineSessionStatus(
    tutorTraits: any,
    studentTraits: any,
    isFirstSession: boolean
  ): SessionData['status'] {
    // Apply persona-based probabilities
    const noShowTutorProb = tutorTraits.noShowRate;
    const noShowStudentProb = studentTraits.churnRisk * 0.2; // Churny students more likely to no-show
    const rescheduleProb = tutorTraits.rescheduleRate;

    // First sessions rarely get cancelled/no-showed
    const firstSessionMultiplier = isFirstSession ? 0.3 : 1.0;

    if (this.random.boolean(noShowTutorProb * firstSessionMultiplier)) {
      return 'no_show_tutor';
    }
    if (this.random.boolean(noShowStudentProb * firstSessionMultiplier)) {
      return 'no_show_student';
    }
    if (this.random.boolean(rescheduleProb * firstSessionMultiplier)) {
      return 'rescheduled';
    }
    if (this.random.boolean(0.02)) { // Small chance of cancellation
      return 'cancelled';
    }

    return 'completed';
  }

  // Determine if technical issues occur
  private determineTechnicalIssues(scheduledStart: Date): boolean {
    const isFirstWeek = this.dateGen.isFirstWeek(
      scheduledStart,
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    );

    return this.random.applyProbability(
      sessionTraitProbabilities.technicalIssues.base,
      sessionTraitProbabilities.technicalIssues.modifiers,
      { ifFirstWeek: isFirstWeek }
    );
  }

  // Determine video availability
  private determineVideoAvailability(hasTechIssues: boolean): boolean {
    return this.random.applyProbability(
      sessionTraitProbabilities.hasVideoAnalysis.base,
      sessionTraitProbabilities.hasVideoAnalysis.modifiers,
      { ifTechnicalIssues: hasTechIssues }
    );
  }

  // Determine screen monitoring availability
  private determineScreenAvailability(hasTechIssues: boolean): boolean {
    return this.random.applyProbability(
      sessionTraitProbabilities.hasScreenMonitoring.base,
      sessionTraitProbabilities.hasScreenMonitoring.modifiers,
      { ifTechnicalIssues: hasTechIssues }
    );
  }

  // Estimate session quality based on personas
  private estimateSessionQuality(
    tutorTraits: any,
    studentTraits: any,
    isFirstSession: boolean
  ): number {
    // Base quality from tutor engagement score
    let quality = this.random.gaussianInRange(
      tutorTraits.engagementScore.min,
      tutorTraits.engagementScore.max
    );

    // Adjust based on student engagement
    const studentEngagement = this.random.gaussianInRange(
      studentTraits.engagementLevel.min,
      studentTraits.engagementLevel.max
    );
    quality = (quality + studentEngagement) / 2;

    // First sessions might be slightly lower
    if (isFirstSession) {
      quality *= 0.9;
    }

    return Math.max(0, Math.min(10, quality));
  }

  // Determine if homework was assigned
  private determineHomeworkAssigned(status: string, sessionQuality: number): boolean {
    if (status !== 'completed') return false;

    return this.random.applyProbability(
      sessionTraitProbabilities.homeworkAssigned.base,
      sessionTraitProbabilities.homeworkAssigned.modifiers,
      {
        ifSessionScoreAbove7: sessionQuality > 7,
        ifSessionScoreBelow5: sessionQuality < 5,
        ifNoShow: false,
      }
    );
  }

  // Determine if follow-up was booked
  private determineFollowUpBooked(
    status: string,
    sessionQuality: number,
    isFirstSession: boolean
  ): boolean {
    if (status !== 'completed') return false;

    return this.random.applyProbability(
      sessionTraitProbabilities.followUpBooked.base,
      sessionTraitProbabilities.followUpBooked.modifiers,
      {
        ifHighSatisfaction: sessionQuality > 8,
        ifFirstSessionGood: isFirstSession && sessionQuality > 7,
        ifLowSatisfaction: sessionQuality < 4,
        ifNoShow: false,
      }
    );
  }

  // Generate technical issue description
  private generateTechnicalDescription(): string {
    const issues = [
      'Audio connection issues - student microphone cutting out',
      'Video freezing intermittently',
      'Platform login difficulties at session start',
      'Screen sharing not working properly',
      'Internet connectivity problems',
      'Browser compatibility issues',
      'Whiteboard tool not loading',
    ];

    return this.random.pick(issues);
  }

  // Generate AI summary for completed sessions
  generateAiSummary(session: SessionData, metrics?: any): string {
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

    const quality = session.overallSessionScore || this.estimateSessionQuality(
      session._meta.tutorTraits,
      session._meta.studentTraits,
      session._meta.isFirstSession
    );

    let category: keyof typeof summaries;
    if (quality >= 8) category = 'excellent';
    else if (quality >= 6) category = 'good';
    else category = 'needsImprovement';

    const baseSummary = this.random.pick(summaries[category]);

    // Add specific details
    const details = [];
    if (session._meta.isFirstSession) {
      details.push('First session establishing baseline understanding.');
    }
    if (session.technicalIssues) {
      details.push('Some technical difficulties affected session flow.');
    }
    if (session.homeworkAssigned) {
      details.push('Homework assigned to reinforce concepts.');
    }
    if (session.followUpBooked) {
      details.push('Follow-up session scheduled to continue progress.');
    }

    return details.length > 0
      ? `${baseSummary} ${details.join(' ')}`
      : baseSummary;
  }
}