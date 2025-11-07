// ============================================
// ENUM TYPES - Used throughout the application
// ============================================

// User & Authentication
export const UserRole = {
  ADMIN: 'admin',
  TUTOR: 'tutor',
  STUDENT: 'student',
} as const;
export type UserRoleType = typeof UserRole[keyof typeof UserRole];

// Session Management
export const SessionStatus = {
  SCHEDULED: 'scheduled',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  NO_SHOW_TUTOR: 'no_show_tutor',
  NO_SHOW_STUDENT: 'no_show_student',
  CANCELLED: 'cancelled',
  RESCHEDULED: 'rescheduled',
} as const;
export type SessionStatusType = typeof SessionStatus[keyof typeof SessionStatus];

export const RescheduleBy = {
  TUTOR: 'tutor',
  STUDENT: 'student',
} as const;
export type RescheduleByType = typeof RescheduleBy[keyof typeof RescheduleBy];

// Alert System
export const AlertType = {
  HIGH_TALK_RATIO: 'high_talk_ratio',
  LOW_UNDERSTANDING_CHECKS: 'low_understanding_checks',
  STUDENT_FRUSTRATION_DETECTED: 'student_frustration_detected',
  POOR_FIRST_SESSION: 'poor_first_session',
  HIGH_RESCHEDULE_RATE: 'high_reschedule_rate',
  NO_SHOW_PATTERN: 'no_show_pattern',
  DECLINING_PERFORMANCE: 'declining_performance',
  STUDENT_CHURN_RISK: 'student_churn_risk',
} as const;
export type AlertTypeType = typeof AlertType[keyof typeof AlertType];

export const AlertSeverity = {
  INFO: 'info',
  WARNING: 'warning',
  CRITICAL: 'critical',
} as const;
export type AlertSeverityType = typeof AlertSeverity[keyof typeof AlertSeverity];

// Achievement System
export const AchievementType = {
  ENGAGEMENT_MASTER: 'engagement_master',
  QUESTION_GURU: 'question_guru',
  FIRST_SESSION_EXPERT: 'first_session_expert',
  CONSISTENCY_CHAMPION: 'consistency_champion',
  STUDENT_FAVORITE: 'student_favorite',
  RISING_STAR: 'rising_star',
} as const;
export type AchievementTypeType = typeof AchievementType[keyof typeof AchievementType];

// Student Status
export const StudentStatus = {
  ACTIVE: 'active',
  CHURNED: 'churned',
  PAUSED: 'paused',
} as const;
export type StudentStatusType = typeof StudentStatus[keyof typeof StudentStatus];

// Churn Reasons
export const ChurnReason = {
  POOR_FIRST_SESSION: 'poor_first_session',
  TUTOR_MISMATCH: 'tutor_mismatch',
  NO_PROGRESS: 'no_progress',
  SCHEDULING_DIFFICULTY: 'scheduling_difficulty',
  PRICE_CONCERNS: 'price_concerns',
  TECHNICAL_ISSUES: 'technical_issues',
  FOUND_COMPETITOR: 'found_competitor',
  COMPLETED_GOALS: 'completed_goals',
  PERSONAL_CIRCUMSTANCES: 'personal_circumstances',
  OTHER: 'other',
} as const;
export type ChurnReasonType = typeof ChurnReason[keyof typeof ChurnReason];

// Feedback Tags
export const FeedbackTag = {
  CLEAR_EXPLANATIONS: 'clear_explanations',
  PATIENT: 'patient',
  ENCOURAGING: 'encouraging',
  HELPFUL_EXAMPLES: 'helpful_examples',
  GOOD_PACE: 'good_pace',
  TOO_FAST: 'too_fast',
  TOO_SLOW: 'too_slow',
  DIDNT_CHECK_UNDERSTANDING: 'didnt_check_understanding',
  TOO_MUCH_TALKING: 'too_much_talking',
  CONFUSING_EXAMPLES: 'confusing_examples',
  TECHNICAL_ISSUES: 'technical_issues',
  MADE_LEARNING_FUN: 'made_learning_fun',
} as const;
export type FeedbackTagType = typeof FeedbackTag[keyof typeof FeedbackTag];

// Transcript Highlights
export const HighlightType = {
  STRONG_QUESTION: 'strong_question',
  BREAKTHROUGH: 'breakthrough',
  CONFUSION: 'confusion',
  POSITIVE_REINFORCEMENT: 'positive_reinforcement',
  CONCERN: 'concern',
  CONCEPT_EXPLANATION: 'concept_explanation',
} as const;
export type HighlightTypeType = typeof HighlightType[keyof typeof HighlightType];

export const TranscriptSpeaker = {
  TUTOR: 'tutor',
  STUDENT: 'student',
} as const;
export type TranscriptSpeakerType = typeof TranscriptSpeaker[keyof typeof TranscriptSpeaker];

// Tutor Insights
export const InsightType = {
  STRENGTH: 'strength',
  GROWTH_AREA: 'growth_area',
  ACHIEVEMENT: 'achievement',
} as const;
export type InsightTypeType = typeof InsightType[keyof typeof InsightType];

export const InsightCategory = {
  HIGH_ENGAGEMENT: 'high_engagement',
  LOW_ENGAGEMENT: 'low_engagement',
  HIGH_TALK_RATIO: 'high_talk_ratio',
  BALANCED_TALK_RATIO: 'balanced_talk_ratio',
  FREQUENT_UNDERSTANDING_CHECKS: 'frequent_understanding_checks',
  INFREQUENT_UNDERSTANDING_CHECKS: 'infrequent_understanding_checks',
  STRONG_QUESTIONING: 'strong_questioning',
  LOW_VISUAL_AIDS: 'low_visual_aids',
  HIGH_VISUAL_AIDS: 'high_visual_aids',
  POSITIVE_REINFORCEMENT: 'positive_reinforcement',
  FIRST_SESSION_EXPERT: 'first_session_expert',
} as const;
export type InsightCategoryType = typeof InsightCategory[keyof typeof InsightCategory];

// Performance Snapshots
export const SnapshotPeriodType = {
  DAILY: 'daily',
  WEEKLY: 'weekly',
} as const;
export type SnapshotPeriodTypeType = typeof SnapshotPeriodType[keyof typeof SnapshotPeriodType];

// Risk Levels
export const RiskLevel = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
} as const;
export type RiskLevelType = typeof RiskLevel[keyof typeof RiskLevel];

// Grade Levels
export const GradeLevel = {
  SIXTH: '6th',
  SEVENTH: '7th',
  EIGHTH: '8th',
  NINTH: '9th',
  TENTH: '10th',
  ELEVENTH: '11th',
  TWELFTH: '12th',
  COLLEGE: 'college',
  ADULT: 'adult',
} as const;
export type GradeLevelType = typeof GradeLevel[keyof typeof GradeLevel];

// Churn Factor Categories
export const ChurnFactorCategory = {
  FIRST_SESSION_SATISFACTION: 'first_session_satisfaction',
  SESSIONS_COMPLETED: 'sessions_completed',
  FOLLOW_UP_BOOKING_RATE: 'follow_up_booking_rate',
  AVG_SESSION_SCORE: 'avg_session_score',
  TUTOR_CONSISTENCY: 'tutor_consistency',
  STUDENT_ENGAGEMENT: 'student_engagement',
  TUTOR_SWITCH_FREQUENCY: 'tutor_switch_frequency',
  SCHEDULING_FRICTION: 'scheduling_friction',
  RESPONSE_RATE: 'response_rate',
} as const;
export type ChurnFactorCategoryType = typeof ChurnFactorCategory[keyof typeof ChurnFactorCategory];

// ============================================
// TYPESCRIPT INTERFACES
// ============================================

// Churn Factor Interface
export interface ChurnFactor {
  category: ChurnFactorCategoryType;
  weight: number;
  value: number;
  normalized_score: number;
  impact: 'positive' | 'negative';
  contribution_to_risk: number;
}

// Subject Interface
export interface Subject {
  id: string;
  name: string;
  category: string;
  created_at: Date;
}

// Alert Threshold Interface
export interface AlertThreshold {
  alert_type: AlertTypeType;
  severity: AlertSeverityType;
  condition: string;
  threshold_value: number;
  lookback_period_days: number;
}
