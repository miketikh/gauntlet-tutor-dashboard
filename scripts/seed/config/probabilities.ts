// Configurable probabilities for various session traits and outcomes

export interface SessionTraitProbability {
  base: number; // Base probability (0-1)
  modifiers?: {
    [condition: string]: number; // Conditional probability adjustments
  };
}

export const sessionTraitProbabilities = {
  // Session availability of different analysis types
  hasVideoAnalysis: {
    base: 0.50,
    modifiers: {
      ifTechnicalIssues: 0.20,
    }
  },
  hasScreenMonitoring: {
    base: 0.40,
    modifiers: {
      ifTechnicalIssues: 0.10,
    }
  },

  // Session events
  studentFrustration: {
    base: 0.15,
    modifiers: {
      ifHighTalkRatio: 0.35,
      ifLowUnderstandingChecks: 0.30,
      ifStrugglingSrudent: 0.40,
      ifFirstSession: 0.20,
    }
  },
  studentConfusion: {
    base: 0.20,
    modifiers: {
      ifFirstSession: 0.30,
      ifComplexSubject: 0.25,
      ifLowUnderstandingChecks: 0.35,
    }
  },
  technicalIssues: {
    base: 0.05,
    modifiers: {
      ifFirstWeek: 0.10, // New tutors/students more likely to have tech issues
    }
  },

  // Session outcomes
  homeworkAssigned: {
    base: 0.70,
    modifiers: {
      ifSessionScoreAbove7: 0.85,
      ifSessionScoreBelow5: 0.40,
      ifNoShow: 0.0,
    }
  },
  followUpBooked: {
    base: 0.65,
    modifiers: {
      ifHighSatisfaction: 0.90,
      ifFirstSessionGood: 0.85,
      ifLowSatisfaction: 0.30,
      ifNoShow: 0.10,
    }
  },

  // Student feedback
  studentProvidesFeedback: {
    base: 0.40,
    modifiers: {
      ifHighEngagement: 0.60,
      ifLowEngagement: 0.20,
      ifFirstSession: 0.55,
    }
  },

  // Session status probabilities
  sessionCompleted: {
    base: 0.88,
    modifiers: {
      ifAtRiskTutor: 0.65,
      ifFirstSession: 0.92, // First sessions rarely cancelled
    }
  },
  noShowStudent: {
    base: 0.06,
    modifiers: {
      ifStrugglingStudent: 0.12,
      ifPreviousNoShow: 0.20,
    }
  },
  noShowTutor: {
    base: 0.03,
    modifiers: {
      ifAtRiskTutor: 0.15,
      ifStrugglingTutor: 0.08,
    }
  },
  rescheduled: {
    base: 0.03,
    modifiers: {
      ifAtRiskTutor: 0.10,
      ifFirstWeek: 0.05,
    }
  },
};

// Subject complexity affects confusion and difficulty
export const subjectComplexity: Record<string, number> = {
  'Calculus': 0.9,
  'Physics': 0.85,
  'Chemistry': 0.8,
  'Advanced Math': 0.85,
  'Algebra II': 0.7,
  'Geometry': 0.6,
  'Biology': 0.6,
  'English Literature': 0.5,
  'Basic Math': 0.3,
  'Elementary Reading': 0.2,
  // Default for unlisted subjects
  default: 0.5,
};

// Feedback tag probabilities based on session performance
export const feedbackTagProbabilities = {
  positive: {
    // Tags likely when session goes well
    clear_explanations: {
      base: 0.7,
      ifHighScore: 0.9,
    },
    patient: {
      base: 0.6,
      ifLowFrustration: 0.8,
    },
    encouraging: {
      base: 0.5,
      ifHighEngagement: 0.75,
    },
    helpful_examples: {
      base: 0.6,
      ifHighScore: 0.8,
    },
    good_pace: {
      base: 0.5,
      ifBalancedTalkRatio: 0.75,
    },
    made_learning_fun: {
      base: 0.4,
      ifHighEngagement: 0.65,
    },
  },
  negative: {
    // Tags likely when issues exist
    too_fast: {
      base: 0.15,
      ifHighConfusion: 0.4,
    },
    too_slow: {
      base: 0.10,
      ifLowEngagement: 0.25,
    },
    didnt_check_understanding: {
      base: 0.20,
      ifLowUnderstandingChecks: 0.60,
    },
    too_much_talking: {
      base: 0.25,
      ifHighTalkRatio: 0.70,
    },
    confusing_examples: {
      base: 0.15,
      ifHighConfusion: 0.45,
    },
    technical_issues: {
      base: 0.05,
      ifTechnicalIssues: 0.95,
    },
  },
};

// Time distribution for sessions (hour of day, 0-23)
export const sessionTimeDistribution: Record<number, number> = {
  // Weights for each hour (higher = more likely)
  6: 0.5,   // 6 AM
  7: 1.0,   // 7 AM
  8: 1.5,   // 8 AM
  9: 2.0,   // 9 AM
  10: 2.5,  // 10 AM
  11: 2.5,  // 11 AM
  12: 2.0,  // 12 PM
  13: 2.5,  // 1 PM
  14: 3.0,  // 2 PM
  15: 4.0,  // 3 PM - School ends
  16: 5.0,  // 4 PM - Peak
  17: 5.0,  // 5 PM - Peak
  18: 4.5,  // 6 PM
  19: 4.0,  // 7 PM
  20: 3.0,  // 8 PM
  21: 1.5,  // 9 PM
  22: 0.5,  // 10 PM
};

// Day of week distribution (0 = Sunday, 6 = Saturday)
export const dayOfWeekDistribution: Record<number, number> = {
  0: 3.0,  // Sunday
  1: 4.0,  // Monday
  2: 4.5,  // Tuesday
  3: 4.5,  // Wednesday
  4: 4.0,  // Thursday
  5: 3.5,  // Friday
  6: 3.5,  // Saturday
};