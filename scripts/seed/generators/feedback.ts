// Feedback and transcript highlights generation

import { SeededRandom } from '../utils/random';
import { feedbackTagProbabilities } from '../config/probabilities';
import type { SessionData } from '../factories/sessionFactory';
import type { AudioMetrics } from './metrics';
import { FeedbackTag, HighlightType, TranscriptSpeaker } from '../../../lib/db/types';

export interface SessionFeedback {
  sessionId: string;
  studentSatisfactionRating: number;
  feedbackText?: string;
  tags: string[];
}

export interface TranscriptHighlight {
  id?: string;
  sessionId: string;
  timestampSeconds: number;
  speaker: 'tutor' | 'student';
  text: string;
  highlightType: string;
}

export class FeedbackGenerator {
  constructor(private random: SeededRandom) {}

  // Generate student feedback for a session
  generateFeedback(
    session: SessionData,
    audioMetrics: AudioMetrics,
    overallScore: number
  ): SessionFeedback | null {
    // Check if student provides feedback based on engagement
    const feedbackProbability = this.determineFeedbackProbability(
      audioMetrics.studentEngagementScore,
      session._meta.isFirstSession
    );

    if (!this.random.boolean(feedbackProbability)) {
      return null;
    }

    // Generate satisfaction rating based on overall score and student experience
    const satisfactionRating = this.generateSatisfactionRating(
      overallScore,
      audioMetrics
    );

    // Generate feedback tags based on session metrics
    const tags = this.generateFeedbackTags(
      audioMetrics,
      satisfactionRating,
      overallScore
    );

    // Generate feedback text
    const feedbackText = this.generateFeedbackText(
      satisfactionRating,
      tags,
      session._meta.isFirstSession
    );

    return {
      sessionId: session.id || '',
      studentSatisfactionRating: satisfactionRating,
      feedbackText,
      tags,
    };
  }

  // Determine probability of feedback being provided
  private determineFeedbackProbability(
    engagementScore: number,
    isFirstSession: boolean
  ): number {
    let probability = 0.40; // Base probability (40% of sessions get feedback)

    if (engagementScore > 8) {
      probability = 0.60; // High engagement: 60% chance
    } else if (engagementScore < 4) {
      probability = 0.20; // Low engagement: 20% chance
    }

    if (isFirstSession) {
      probability += 0.15; // First sessions get more feedback (up to 55-75%)
    }

    return Math.min(1.0, probability);
  }

  // Generate satisfaction rating
  private generateSatisfactionRating(
    overallScore: number,
    audioMetrics: AudioMetrics
  ): number {
    // Base rating from overall score (0-10) to (1-5)
    let rating = Math.round(overallScore / 2);
    rating = Math.max(1, Math.min(5, rating));

    // Add some variance
    const variance = this.random.float(-0.5, 0.5);
    rating = Math.round(rating + variance);

    // Apply constraints based on specific issues
    if (audioMetrics.studentFrustrationCount > 5) {
      rating = Math.min(2, rating);
    } else if (audioMetrics.studentFrustrationCount > 2) {
      rating = Math.min(3, rating);
    }

    if (audioMetrics.tutorTalkRatio > 0.75) {
      rating = Math.min(3, rating);
    }

    return Math.max(1, Math.min(5, rating));
  }

  // Generate feedback tags
  private generateFeedbackTags(
    audioMetrics: AudioMetrics,
    satisfactionRating: number,
    overallScore: number
  ): string[] {
    const tags: string[] = [];

    // Conditions for various tags
    const conditions = {
      ifHighScore: overallScore > 7.5,
      ifLowFrustration: audioMetrics.studentFrustrationCount < 2,
      ifHighEngagement: audioMetrics.studentEngagementScore > 7.5,
      ifBalancedTalkRatio: audioMetrics.tutorTalkRatio >= 0.4 && audioMetrics.tutorTalkRatio <= 0.55,
      ifHighConfusion: audioMetrics.studentConfusionCount > 4,
      ifLowEngagement: audioMetrics.studentEngagementScore < 5,
      ifLowUnderstandingChecks: audioMetrics.tutorChecksUnderstandingCount < 3,
      ifHighTalkRatio: audioMetrics.tutorTalkRatio > 0.65,
      ifTechnicalIssues: false, // Would need to pass this from session
    };

    // Check positive tags
    if (satisfactionRating >= 4) {
      for (const [tagKey, tagProb] of Object.entries(feedbackTagProbabilities.positive)) {
        const probability = this.random.applyProbability(
          tagProb.base,
          tagProb as any,
          conditions
        );

        if (this.random.boolean(probability)) {
          tags.push(tagKey);
        }
      }
    }

    // Check negative tags
    if (satisfactionRating <= 3) {
      for (const [tagKey, tagProb] of Object.entries(feedbackTagProbabilities.negative)) {
        const probability = this.random.applyProbability(
          tagProb.base,
          tagProb as any,
          conditions
        );

        if (this.random.boolean(probability)) {
          tags.push(tagKey);
        }
      }
    }

    // Ensure at least one tag
    if (tags.length === 0) {
      if (satisfactionRating >= 4) {
        tags.push(this.random.pick(['patient', 'encouraging', 'helpful_examples']));
      } else {
        tags.push(this.random.pick(['too_slow', 'confusing_examples']));
      }
    }

    return tags;
  }

  // Generate feedback text
  private generateFeedbackText(
    rating: number,
    tags: string[],
    isFirstSession: boolean
  ): string {
    const positiveComments = [
      'Great session! Really helped me understand the concepts.',
      'The tutor was very patient and explained things clearly.',
      'I feel much more confident about this subject now.',
      'Excellent teaching style, very engaging!',
      'Looking forward to the next session.',
    ];

    const neutralComments = [
      'Session was okay, covered the basics.',
      'Got through the material but could use more practice.',
      'Some parts were clear, others need more work.',
      'Decent session overall.',
    ];

    const negativeComments = [
      'Had trouble following along during the session.',
      'Need a different approach to understand this better.',
      'Session felt rushed and confusing.',
      'Didn\'t get my questions answered.',
      'Not sure this teaching style works for me.',
    ];

    let comment: string;
    if (rating >= 4) {
      comment = this.random.pick(positiveComments);
    } else if (rating === 3) {
      comment = this.random.pick(neutralComments);
    } else {
      comment = this.random.pick(negativeComments);
    }

    if (isFirstSession) {
      comment += ' (First session)';
    }

    // Sometimes add specific tag-related comments
    if (this.random.boolean(0.3) && tags.length > 0) {
      const tagComments: Record<string, string> = {
        clear_explanations: ' The explanations were very clear.',
        patient: ' Appreciated the patience.',
        too_fast: ' Pace was too fast for me.',
        too_much_talking: ' Would like more time to practice.',
        technical_issues: ' Had some technical problems.',
      };

      const relevantTag = tags.find(tag => tagComments[tag]);
      if (relevantTag) {
        comment += tagComments[relevantTag];
      }
    }

    return comment;
  }

  // Generate transcript highlights
  generateTranscriptHighlights(
    session: SessionData,
    audioMetrics: AudioMetrics
  ): TranscriptHighlight[] {
    const highlights: TranscriptHighlight[] = [];
    const duration = session.actualDuration || session.scheduledDuration;

    // Generate 3-5 highlights per session
    const highlightCount = this.random.int(3, 5);

    for (let i = 0; i < highlightCount; i++) {
      // Distribute highlights throughout the session
      const timestampSeconds = Math.floor(
        (duration * 60 * (i + 1)) / (highlightCount + 1)
      );

      const highlight = this.generateSingleHighlight(
        session.id || '',
        timestampSeconds,
        audioMetrics,
        session._meta.isFirstSession
      );

      highlights.push(highlight);
    }

    return highlights;
  }

  // Generate a single transcript highlight
  private generateSingleHighlight(
    sessionId: string,
    timestampSeconds: number,
    audioMetrics: AudioMetrics,
    isFirstSession: boolean
  ): TranscriptHighlight {
    // Determine highlight type based on metrics
    let highlightType: string;
    let speaker: 'tutor' | 'student';
    let text: string;

    const types = [
      {
        type: HighlightType.STRONG_QUESTION,
        probability: audioMetrics.openEndedQuestions > 10 ? 0.3 : 0.1,
        speaker: TranscriptSpeaker.TUTOR as 'tutor',
        texts: [
          'Can you explain how you arrived at that answer?',
          'What would happen if we changed this variable?',
          'How does this concept relate to what we learned last time?',
        ],
      },
      {
        type: HighlightType.BREAKTHROUGH,
        probability: audioMetrics.studentEngagementScore > 7 ? 0.2 : 0.05,
        speaker: TranscriptSpeaker.STUDENT as 'student',
        texts: [
          'Oh! I get it now! So that\'s why it works that way.',
          'This makes so much more sense now!',
          'I see the pattern now!',
        ],
      },
      {
        type: HighlightType.CONFUSION,
        probability: audioMetrics.studentConfusionCount > 0 ? 0.3 : 0.1,
        speaker: TranscriptSpeaker.STUDENT as 'student',
        texts: [
          'I\'m still confused about this part.',
          'Wait, can you explain that again?',
          'I don\'t understand how we got to this step.',
        ],
      },
      {
        type: HighlightType.POSITIVE_REINFORCEMENT,
        probability: audioMetrics.tutorPositiveReinforcementCount > 5 ? 0.3 : 0.1,
        speaker: TranscriptSpeaker.TUTOR as 'tutor',
        texts: [
          'Excellent work! You\'re really getting the hang of this.',
          'That\'s exactly right! Great job!',
          'You\'re making fantastic progress!',
        ],
      },
      {
        type: HighlightType.CONCERN,
        probability: audioMetrics.studentFrustrationCount > 2 ? 0.2 : 0.05,
        speaker: TranscriptSpeaker.TUTOR as 'tutor',
        texts: [
          'I can see this is challenging. Let\'s try a different approach.',
          'Let\'s slow down and work through this step by step.',
          'Don\'t worry, this is a difficult concept for many students.',
        ],
      },
      {
        type: HighlightType.CONCEPT_EXPLANATION,
        probability: 0.3,
        speaker: TranscriptSpeaker.TUTOR as 'tutor',
        texts: [
          'The key principle here is...',
          'Think of it this way: imagine...',
          'This formula tells us that...',
        ],
      },
    ];

    // Select highlight type based on probabilities
    const selected = this.random.weightedPick(
      types,
      types.map(t => t.probability)
    );

    highlightType = selected.type;
    speaker = selected.speaker;
    text = this.random.pick(selected.texts);

    // Add context for first sessions
    if (isFirstSession && this.random.boolean(0.3)) {
      if (speaker === TranscriptSpeaker.TUTOR) {
        text = 'Let\'s start by understanding your current level. ' + text;
      }
    }

    return {
      sessionId,
      timestampSeconds,
      speaker,
      text,
      highlightType,
    };
  }
}