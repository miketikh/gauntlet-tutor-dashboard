// Tutor persona definitions with characteristic ranges for metrics

export interface TutorPersonaTrait {
  talkRatio: { min: number; max: number };
  understandingChecks: { min: number; max: number };
  engagementScore: { min: number; max: number };
  satisfactionRating: { min: number; max: number };
  firstSessionSuccess: number; // probability 0-1
  noShowRate: number; // probability 0-1
  rescheduleRate: number; // probability 0-1
  positiveReinforcement: { min: number; max: number };
  openEndedQuestionRatio: number; // ratio of open-ended to total questions
}

export interface TutorPersona {
  name: string;
  count: number;
  traits: TutorPersonaTrait;
  description: string;
}

export const tutorPersonas: Record<string, TutorPersona> = {
  star: {
    name: 'Star Performer',
    count: 2,
    description: 'Exceptional tutors with high engagement and satisfaction',
    traits: {
      talkRatio: { min: 0.35, max: 0.45 },
      understandingChecks: { min: 10, max: 15 },
      engagementScore: { min: 8.0, max: 9.5 },
      satisfactionRating: { min: 4.5, max: 5.0 },
      firstSessionSuccess: 0.9,
      noShowRate: 0.02,
      rescheduleRate: 0.05,
      positiveReinforcement: { min: 8, max: 12 },
      openEndedQuestionRatio: 0.7,
    }
  },
  solid: {
    name: 'Solid Performer',
    count: 2,
    description: 'Reliable tutors with good overall performance',
    traits: {
      talkRatio: { min: 0.45, max: 0.55 },
      understandingChecks: { min: 6, max: 10 },
      engagementScore: { min: 6.5, max: 8.0 },
      satisfactionRating: { min: 3.8, max: 4.5 },
      firstSessionSuccess: 0.75,
      noShowRate: 0.05,
      rescheduleRate: 0.10,
      positiveReinforcement: { min: 5, max: 8 },
      openEndedQuestionRatio: 0.5,
    }
  },
  struggling: {
    name: 'Struggling',
    count: 1,
    description: 'Tutors needing coaching and improvement',
    traits: {
      talkRatio: { min: 0.60, max: 0.75 },
      understandingChecks: { min: 2, max: 5 },
      engagementScore: { min: 4.0, max: 6.5 },
      satisfactionRating: { min: 2.5, max: 3.8 },
      firstSessionSuccess: 0.5,
      noShowRate: 0.15,
      rescheduleRate: 0.20,
      positiveReinforcement: { min: 2, max: 5 },
      openEndedQuestionRatio: 0.3,
    }
  },
  atRisk: {
    name: 'At Risk',
    count: 1,
    description: 'Tutors at high risk of churn or termination',
    traits: {
      talkRatio: { min: 0.70, max: 0.85 },
      understandingChecks: { min: 0, max: 3 },
      engagementScore: { min: 2.0, max: 4.5 },
      satisfactionRating: { min: 1.5, max: 3.0 },
      firstSessionSuccess: 0.3,
      noShowRate: 0.25,
      rescheduleRate: 0.35,
      positiveReinforcement: { min: 0, max: 3 },
      openEndedQuestionRatio: 0.2,
    }
  }
};

// Student persona definitions
export interface StudentPersona {
  name: string;
  count: number;
  description: string;
  traits: {
    engagementLevel: { min: number; max: number };
    responseDelay: { min: number; max: number }; // seconds
    questionFrequency: { min: number; max: number }; // per session
    frustrationProbability: number;
    confusionProbability: number;
    feedbackResponseRate: number;
    churnRisk: number;
  };
}

export const studentPersonas: Record<string, StudentPersona> = {
  engaged: {
    name: 'Highly Engaged',
    count: 8,
    description: 'Active, participatory students',
    traits: {
      engagementLevel: { min: 7.5, max: 9.5 },
      responseDelay: { min: 1.0, max: 3.0 },
      questionFrequency: { min: 5, max: 10 },
      frustrationProbability: 0.05,
      confusionProbability: 0.15,
      feedbackResponseRate: 0.85,
      churnRisk: 0.10,
    }
  },
  average: {
    name: 'Average Engagement',
    count: 8,
    description: 'Typical students with moderate participation',
    traits: {
      engagementLevel: { min: 5.0, max: 7.5 },
      responseDelay: { min: 2.0, max: 5.0 },
      questionFrequency: { min: 2, max: 5 },
      frustrationProbability: 0.15,
      confusionProbability: 0.25,
      feedbackResponseRate: 0.60,
      churnRisk: 0.25,
    }
  },
  struggling: {
    name: 'Struggling',
    count: 4,
    description: 'Students having difficulty or low engagement',
    traits: {
      engagementLevel: { min: 2.0, max: 5.0 },
      responseDelay: { min: 4.0, max: 8.0 },
      questionFrequency: { min: 0, max: 2 },
      frustrationProbability: 0.35,
      confusionProbability: 0.45,
      feedbackResponseRate: 0.40,
      churnRisk: 0.50,
    }
  }
};