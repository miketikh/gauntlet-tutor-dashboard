// Correlation rules for realistic metric relationships

export interface CorrelationEffect {
  multiply?: number;
  add?: number;
  subtract?: number;
  set?: number;
  increase?: number; // Increase probability by this amount
  decrease?: number; // Decrease probability by this amount
}

export interface CorrelationRule {
  name: string;
  description: string;
  trigger: (metrics: any) => boolean;
  effects: Record<string, CorrelationEffect>;
}

export const correlationRules: CorrelationRule[] = [
  {
    name: 'highTutorTalkRatio',
    description: 'High tutor talk ratio reduces student engagement',
    trigger: (metrics) => metrics.tutorTalkRatio > 0.65,
    effects: {
      studentEngagement: { multiply: 0.7 },
      studentQuestions: { multiply: 0.5 },
      studentFrustrationCount: { add: 2 },
      satisfactionRating: { subtract: 1.0 },
      studentTalkRatio: { multiply: 0.6 },
      overallScore: { multiply: 0.8 },
    }
  },
  {
    name: 'veryHighTutorTalkRatio',
    description: 'Very high tutor talk ratio severely impacts session',
    trigger: (metrics) => metrics.tutorTalkRatio > 0.80,
    effects: {
      studentEngagement: { multiply: 0.5 },
      studentQuestions: { set: 0 },
      studentFrustrationCount: { add: 4 },
      satisfactionRating: { subtract: 2.0 },
      overallScore: { multiply: 0.6 },
    }
  },
  {
    name: 'frequentUnderstandingChecks',
    description: 'Frequent understanding checks improve engagement',
    trigger: (metrics) => metrics.tutorChecksUnderstandingCount > 10,
    effects: {
      studentEngagement: { multiply: 1.3 },
      studentConfusionCount: { multiply: 0.5 },
      satisfactionRating: { add: 0.5 },
      overallScore: { add: 1.0 },
      positiveReinforcement: { multiply: 1.2 },
    }
  },
  {
    name: 'noUnderstandingChecks',
    description: 'No understanding checks leads to poor outcomes',
    trigger: (metrics) => metrics.tutorChecksUnderstandingCount === 0,
    effects: {
      studentEngagement: { multiply: 0.6 },
      studentConfusionCount: { add: 3 },
      studentFrustrationCount: { add: 2 },
      satisfactionRating: { subtract: 1.5 },
      overallScore: { subtract: 2.0 },
    }
  },
  {
    name: 'highStudentFrustration',
    description: 'High frustration affects all metrics negatively',
    trigger: (metrics) => metrics.studentFrustrationCount > 5,
    effects: {
      studentEngagement: { multiply: 0.5 },
      satisfactionRating: { set: 2 }, // Cap at 2 stars
      followUpBooked: { set: false },
      overallScore: { multiply: 0.6 },
    }
  },
  {
    name: 'excellentEngagement',
    description: 'Excellent engagement improves all outcomes',
    trigger: (metrics) => metrics.studentEngagementScore > 8.5,
    effects: {
      satisfactionRating: { add: 1.0 },
      followUpBooked: { increase: 0.3 },
      overallScore: { add: 1.5 },
      homeworkAssigned: { increase: 0.2 },
    }
  },
  {
    name: 'balancedConversation',
    description: 'Balanced talk ratio indicates good session flow',
    trigger: (metrics) =>
      metrics.tutorTalkRatio >= 0.40 &&
      metrics.tutorTalkRatio <= 0.50 &&
      metrics.studentTalkRatio >= 0.35,
    effects: {
      studentEngagement: { add: 1.5 },
      satisfactionRating: { add: 0.5 },
      overallScore: { add: 1.0 },
    }
  },
  {
    name: 'highPositiveReinforcement',
    description: 'Frequent positive reinforcement improves satisfaction',
    trigger: (metrics) => metrics.tutorPositiveReinforcementCount > 8,
    effects: {
      studentEngagement: { add: 1.0 },
      satisfactionRating: { add: 0.5 },
      studentFrustrationCount: { multiply: 0.5 },
    }
  },
  {
    name: 'longResponseDelay',
    description: 'Long response delays indicate disengagement',
    trigger: (metrics) => metrics.avgStudentResponseDelay > 6.0,
    effects: {
      studentEngagement: { subtract: 2.0 },
      overallScore: { subtract: 1.0 },
      studentConfusionCount: { add: 2 },
    }
  },
  {
    name: 'manyOpenEndedQuestions',
    description: 'Open-ended questions promote engagement',
    trigger: (metrics) =>
      metrics.openEndedQuestions > metrics.closedEndedQuestions,
    effects: {
      studentEngagement: { add: 1.0 },
      studentQuestions: { multiply: 1.3 },
      overallScore: { add: 0.5 },
    }
  },
  {
    name: 'technicalIssuesImpact',
    description: 'Technical issues affect session quality',
    trigger: (metrics) => metrics.technicalIssues === true,
    effects: {
      studentEngagement: { subtract: 2.0 },
      satisfactionRating: { subtract: 1.0 },
      overallScore: { subtract: 1.5 },
      studentFrustrationCount: { add: 2 },
    }
  },
];

// Special rules for first sessions
export const firstSessionCorrelations: CorrelationRule[] = [
  {
    name: 'firstSessionConfusion',
    description: 'First sessions have higher confusion',
    trigger: () => true, // Always applies to first sessions
    effects: {
      studentConfusionCount: { multiply: 1.5 },
      studentQuestions: { multiply: 1.3 },
      avgStudentResponseDelay: { add: 1.0 },
    }
  },
  {
    name: 'firstSessionImportance',
    description: 'First session score heavily impacts future',
    trigger: (metrics) => metrics.overallScore < 6.5,
    effects: {
      followUpBooked: { multiply: 0.3 },
      churnRisk: { increase: 0.4 },
    }
  },
];

// Video metrics correlations (when video is available)
export const videoMetricCorrelations: CorrelationRule[] = [
  {
    name: 'lowVisualAttention',
    description: 'Low visual attention indicates disengagement',
    trigger: (metrics) => metrics.studentOnScreenAttentionPct < 0.6,
    effects: {
      studentEngagement: { multiply: 0.7 },
      overallScore: { subtract: 1.0 },
    }
  },
  {
    name: 'frequentDistractions',
    description: 'Frequent distractions harm session quality',
    trigger: (metrics) => metrics.distractionEventsCount > 5,
    effects: {
      studentEngagement: { subtract: 2.0 },
      satisfactionRating: { subtract: 0.5 },
      overallScore: { subtract: 1.5 },
    }
  },
  {
    name: 'activeLoteTaking',
    description: 'Note-taking indicates engagement',
    trigger: (metrics) => metrics.studentTakingNotesDuration > 15,
    effects: {
      studentEngagement: { add: 1.5 },
      overallScore: { add: 0.5 },
    }
  },
];

// Screen monitoring correlations
export const screenMetricCorrelations: CorrelationRule[] = [
  {
    name: 'frequentTabSwitching',
    description: 'Tab switching indicates distraction',
    trigger: (metrics) => metrics.tabSwitchesCount > 10,
    effects: {
      studentEngagement: { subtract: 1.5 },
      overallScore: { subtract: 1.0 },
    }
  },
  {
    name: 'gamingDetected',
    description: 'Gaming during session is critical issue',
    trigger: (metrics) => metrics.gamingDetected === true,
    effects: {
      studentEngagement: { set: 2.0 },
      satisfactionRating: { subtract: 2.0 },
      overallScore: { set: 3.0 },
    }
  },
  {
    name: 'activeWhiteboardUse',
    description: 'Whiteboard usage improves learning',
    trigger: (metrics) => metrics.whiteboardUsageMinutes > 20,
    effects: {
      studentEngagement: { add: 1.0 },
      overallScore: { add: 0.5 },
    }
  },
];

// Function to apply all relevant correlations
export function applyCorrelations(
  metrics: any,
  isFirstSession: boolean = false,
  hasVideo: boolean = false,
  hasScreen: boolean = false
): any {
  let modifiedMetrics = { ...metrics };

  // Apply base correlations
  for (const rule of correlationRules) {
    if (rule.trigger(modifiedMetrics)) {
      modifiedMetrics = applyEffects(modifiedMetrics, rule.effects);
    }
  }

  // Apply first session correlations if applicable
  if (isFirstSession) {
    for (const rule of firstSessionCorrelations) {
      if (rule.trigger(modifiedMetrics)) {
        modifiedMetrics = applyEffects(modifiedMetrics, rule.effects);
      }
    }
  }

  // Apply video correlations if available
  if (hasVideo) {
    for (const rule of videoMetricCorrelations) {
      if (rule.trigger(modifiedMetrics)) {
        modifiedMetrics = applyEffects(modifiedMetrics, rule.effects);
      }
    }
  }

  // Apply screen correlations if available
  if (hasScreen) {
    for (const rule of screenMetricCorrelations) {
      if (rule.trigger(modifiedMetrics)) {
        modifiedMetrics = applyEffects(modifiedMetrics, rule.effects);
      }
    }
  }

  return modifiedMetrics;
}

function applyEffects(metrics: any, effects: Record<string, CorrelationEffect>): any {
  const result = { ...metrics };

  for (const [key, effect] of Object.entries(effects)) {
    if (effect.set !== undefined) {
      result[key] = effect.set;
    } else if (effect.multiply !== undefined && result[key] !== undefined) {
      result[key] = result[key] * effect.multiply;
    } else if (effect.add !== undefined && result[key] !== undefined) {
      result[key] = result[key] + effect.add;
    } else if (effect.subtract !== undefined && result[key] !== undefined) {
      result[key] = Math.max(0, result[key] - effect.subtract);
    } else if (effect.increase !== undefined) {
      // For probability adjustments
      result[key] = Math.min(1, (result[key] || 0) + effect.increase);
    } else if (effect.decrease !== undefined) {
      result[key] = Math.max(0, (result[key] || 0) - effect.decrease);
    }
  }

  return result;
}