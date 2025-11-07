// Metrics generation with correlations

import { SeededRandom } from '../utils/random';
import { applyCorrelations } from '../config/correlations';
import type { SessionData } from '../factories/sessionFactory';

export interface AudioMetrics {
  sessionId: string;
  tutorTalkRatio: number;
  studentTalkRatio: number;
  productiveSilenceRatio: number;
  awkwardPauseRatio: number;
  studentEngagementScore: number;
  tutorEnthusiasmScore: number;
  avgStudentResponseDelay: number;
  longPausesCount: number;
  studentInitiatedQuestions: number;
  studentFrustrationCount: number;
  studentConfusionCount: number;
  positiveMomentsCount: number;
  tutorChecksUnderstandingCount: number;
  tutorPositiveReinforcementCount: number;
  conceptReExplanationCount: number;
  openEndedQuestions: number;
  closedEndedQuestions: number;
  rhetoricalQuestions: number;
}

export interface VideoMetrics {
  sessionId: string;
  studentOnScreenAttentionPct: number;
  studentVisualEngagementScore: number;
  distractionEventsCount: number;
  confusionMomentsCount: number;
  tutorUsesVisualAids: boolean;
  studentTakingNotesDuration: number;
}

export interface ScreenMetrics {
  sessionId: string;
  activeTabFocusPct: number;
  tabSwitchesCount: number;
  whiteboardUsageMinutes: number;
  messagingAppDetected: boolean;
  gamingDetected: boolean;
}

export class MetricsGenerator {
  constructor(private random: SeededRandom) {}

  // Generate audio metrics (always present for completed sessions)
  generateAudioMetrics(session: SessionData): AudioMetrics {
    const tutorTraits = session._meta.tutorTraits;
    const studentTraits = session._meta.studentTraits;

    // Base metrics from personas
    let tutorTalkRatio = this.random.gaussianInRange(
      tutorTraits.talkRatio.min,
      tutorTraits.talkRatio.max
    );

    // Student talk ratio depends on tutor talk ratio
    let studentTalkRatio = Math.max(0.1, 0.85 - tutorTalkRatio - this.random.float(0, 0.1));

    // Silence ratios fill the remainder
    const totalTalk = tutorTalkRatio + studentTalkRatio;
    const silenceRatio = Math.max(0, 1 - totalTalk);
    const productiveSilenceRatio = silenceRatio * this.random.float(0.3, 0.7);
    const awkwardPauseRatio = silenceRatio - productiveSilenceRatio;

    // Understanding checks from tutor persona
    let tutorChecksUnderstandingCount = this.random.int(
      tutorTraits.understandingChecks.min,
      tutorTraits.understandingChecks.max
    );

    // Engagement from both personas
    let studentEngagementScore = this.random.gaussianInRange(
      studentTraits.engagementLevel.min,
      studentTraits.engagementLevel.max
    );

    // Tutor enthusiasm correlates with persona quality
    let tutorEnthusiasmScore = this.random.gaussianInRange(
      tutorTraits.engagementScore.min,
      tutorTraits.engagementScore.max
    );

    // Response delay from student persona
    let avgStudentResponseDelay = this.random.gaussianInRange(
      studentTraits.responseDelay.min,
      studentTraits.responseDelay.max
    );

    // Question counts
    let studentInitiatedQuestions = this.random.gaussianInRange(
      studentTraits.questionFrequency.min,
      studentTraits.questionFrequency.max
    );

    // Frustration and confusion based on personas and probabilities
    let studentFrustrationCount = 0;
    if (this.random.boolean(studentTraits.frustrationProbability)) {
      studentFrustrationCount = this.random.int(1, 5);
    }

    let studentConfusionCount = 0;
    if (this.random.boolean(studentTraits.confusionProbability)) {
      studentConfusionCount = this.random.int(1, 6);
    }

    // Positive reinforcement from tutor persona
    let tutorPositiveReinforcementCount = this.random.int(
      tutorTraits.positiveReinforcement.min,
      tutorTraits.positiveReinforcement.max
    );

    // Question types based on tutor quality
    const totalQuestions = this.random.int(10, 30);
    const openRatio = tutorTraits.openEndedQuestionRatio;
    let openEndedQuestions = Math.round(totalQuestions * openRatio);
    let closedEndedQuestions = Math.round(totalQuestions * (1 - openRatio) * 0.8);
    let rhetoricalQuestions = totalQuestions - openEndedQuestions - closedEndedQuestions;

    // Other metrics
    const longPausesCount = awkwardPauseRatio > 0.1 ? this.random.int(2, 8) : this.random.int(0, 2);
    const positiveMomentsCount = this.random.int(3, 10);
    const conceptReExplanationCount = studentConfusionCount > 0
      ? this.random.int(1, Math.min(3, studentConfusionCount))
      : 0;

    // Create base metrics object
    let metrics: any = {
      sessionId: session.id || '',
      tutorTalkRatio,
      studentTalkRatio,
      productiveSilenceRatio,
      awkwardPauseRatio,
      studentEngagementScore,
      tutorEnthusiasmScore,
      avgStudentResponseDelay,
      longPausesCount,
      studentInitiatedQuestions,
      studentFrustrationCount,
      studentConfusionCount,
      positiveMomentsCount,
      tutorChecksUnderstandingCount,
      tutorPositiveReinforcementCount,
      conceptReExplanationCount,
      openEndedQuestions,
      closedEndedQuestions,
      rhetoricalQuestions,
      technicalIssues: session.technicalIssues,
    };

    // Apply correlations based on metrics
    metrics = applyCorrelations(
      metrics,
      session._meta.isFirstSession,
      false, // hasVideo
      false  // hasScreen
    );

    // Clean up and ensure valid ranges
    metrics = this.normalizeMetrics(metrics);

    // Remove temporary fields
    delete metrics.technicalIssues;

    return metrics as AudioMetrics;
  }

  // Generate video metrics (optional)
  generateVideoMetrics(session: SessionData): VideoMetrics | null {
    if (!session.hasVideoAnalysis) return null;

    const studentTraits = session._meta.studentTraits;

    // Base attention from engagement level
    let studentOnScreenAttentionPct = this.random.gaussianInRange(
      studentTraits.engagementLevel.min / 10,
      studentTraits.engagementLevel.max / 10
    );

    // Visual engagement similar to general engagement
    let studentVisualEngagementScore = this.random.gaussianInRange(
      studentTraits.engagementLevel.min,
      studentTraits.engagementLevel.max
    );

    // Distraction events inversely related to engagement
    const baseDistractions = 10 - studentTraits.engagementLevel.min;
    let distractionEventsCount = this.random.int(0, Math.max(0, baseDistractions));

    // Confusion moments from audio metrics
    let confusionMomentsCount = this.random.int(0, 5);
    if (this.random.boolean(studentTraits.confusionProbability)) {
      confusionMomentsCount += this.random.int(2, 5);
    }

    // Visual aids based on tutor quality
    const tutorTraits = session._meta.tutorTraits;
    const tutorUsesVisualAids = this.random.boolean(
      tutorTraits.engagementScore.max > 7 ? 0.7 : 0.3
    );

    // Note-taking duration (engaged students take more notes)
    let studentTakingNotesDuration = 0;
    if (studentTraits.engagementLevel.max > 7) {
      studentTakingNotesDuration = this.random.int(10, 30);
    } else if (studentTraits.engagementLevel.max > 5) {
      studentTakingNotesDuration = this.random.int(5, 15);
    } else {
      studentTakingNotesDuration = this.random.int(0, 5);
    }

    let metrics: any = {
      sessionId: session.id || '',
      studentOnScreenAttentionPct,
      studentVisualEngagementScore,
      distractionEventsCount,
      confusionMomentsCount,
      tutorUsesVisualAids,
      studentTakingNotesDuration,
    };

    // Apply video-specific correlations
    metrics = applyCorrelations(metrics, false, true, false);
    metrics = this.normalizeMetrics(metrics);

    return metrics as VideoMetrics;
  }

  // Generate screen metrics (optional)
  generateScreenMetrics(session: SessionData): ScreenMetrics | null {
    if (!session.hasScreenMonitoring) return null;

    const studentTraits = session._meta.studentTraits;

    // Tab focus based on engagement
    let activeTabFocusPct = this.random.gaussianInRange(
      studentTraits.engagementLevel.min / 10,
      studentTraits.engagementLevel.max / 10
    );

    // Tab switches inversely related to engagement
    const maxSwitches = 20 - Math.floor(studentTraits.engagementLevel.min);
    let tabSwitchesCount = this.random.int(0, Math.max(0, maxSwitches));

    // Whiteboard usage based on subject and tutor quality
    const tutorTraits = session._meta.tutorTraits;
    let whiteboardUsageMinutes = 0;
    if (session.subjectName?.includes('Math') || session.subjectName?.includes('Physics')) {
      // Math/science subjects use whiteboard more
      whiteboardUsageMinutes = this.random.int(10, 40);
    } else {
      whiteboardUsageMinutes = this.random.int(0, 15);
    }

    // Messaging/gaming detection for struggling students
    const messagingAppDetected = studentTraits.engagementLevel.max < 5
      ? this.random.boolean(0.3)
      : this.random.boolean(0.05);

    const gamingDetected = studentTraits.engagementLevel.max < 4
      ? this.random.boolean(0.1)
      : false;

    let metrics: any = {
      sessionId: session.id || '',
      activeTabFocusPct,
      tabSwitchesCount,
      whiteboardUsageMinutes,
      messagingAppDetected,
      gamingDetected,
    };

    // Apply screen-specific correlations
    metrics = applyCorrelations(metrics, false, false, true);
    metrics = this.normalizeMetrics(metrics);

    return metrics as ScreenMetrics;
  }

  // Calculate overall session score based on all metrics
  calculateOverallScore(
    audioMetrics: AudioMetrics,
    videoMetrics?: VideoMetrics | null,
    screenMetrics?: ScreenMetrics | null
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

  // Normalize metrics to ensure valid ranges
  private normalizeMetrics(metrics: any): any {
    const normalized = { ...metrics };

    // Ensure ratios are between 0 and 1
    const ratioFields = [
      'tutorTalkRatio', 'studentTalkRatio', 'productiveSilenceRatio',
      'awkwardPauseRatio', 'studentOnScreenAttentionPct', 'activeTabFocusPct'
    ];

    for (const field of ratioFields) {
      if (normalized[field] !== undefined) {
        normalized[field] = Math.max(0, Math.min(1, normalized[field]));
      }
    }

    // Ensure scores are between 0 and 10
    const scoreFields = [
      'studentEngagementScore', 'tutorEnthusiasmScore',
      'studentVisualEngagementScore'
    ];

    for (const field of scoreFields) {
      if (normalized[field] !== undefined) {
        normalized[field] = Math.max(0, Math.min(10, normalized[field]));
      }
    }

    // Ensure counts are non-negative integers
    const countFields = [
      'longPausesCount', 'studentInitiatedQuestions', 'studentFrustrationCount',
      'studentConfusionCount', 'positiveMomentsCount', 'tutorChecksUnderstandingCount',
      'tutorPositiveReinforcementCount', 'conceptReExplanationCount',
      'openEndedQuestions', 'closedEndedQuestions', 'rhetoricalQuestions',
      'distractionEventsCount', 'confusionMomentsCount', 'tabSwitchesCount'
    ];

    for (const field of countFields) {
      if (normalized[field] !== undefined) {
        normalized[field] = Math.max(0, Math.round(normalized[field]));
      }
    }

    // Ensure delays are positive
    if (normalized.avgStudentResponseDelay !== undefined) {
      normalized.avgStudentResponseDelay = Math.max(0.5, normalized.avgStudentResponseDelay);
    }

    // Ensure durations are non-negative
    if (normalized.studentTakingNotesDuration !== undefined) {
      normalized.studentTakingNotesDuration = Math.max(0, Math.round(normalized.studentTakingNotesDuration));
    }
    if (normalized.whiteboardUsageMinutes !== undefined) {
      normalized.whiteboardUsageMinutes = Math.max(0, Math.round(normalized.whiteboardUsageMinutes));
    }

    return normalized;
  }
}