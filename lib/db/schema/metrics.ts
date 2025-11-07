import { pgTable, uuid, decimal, integer, timestamp, boolean, text, varchar, pgEnum, primaryKey, check } from 'drizzle-orm/pg-core';
import { sessions } from './sessions';
import { sql } from 'drizzle-orm';

// Transcript speaker enum
export const transcriptSpeakerEnum = pgEnum('transcript_speaker', ['tutor', 'student']);

// Highlight type enum
export const highlightTypeEnum = pgEnum('highlight_type', [
  'strong_question',
  'breakthrough',
  'confusion',
  'positive_reinforcement',
  'concern',
  'concept_explanation',
]);

// Feedback tag enum
export const feedbackTagEnum = pgEnum('feedback_tag', [
  'clear_explanations',
  'patient',
  'encouraging',
  'helpful_examples',
  'good_pace',
  'too_fast',
  'too_slow',
  'didnt_check_understanding',
  'too_much_talking',
  'confusing_examples',
  'technical_issues',
  'made_learning_fun',
]);

// Session audio metrics
export const sessionAudioMetrics = pgTable('session_audio_metrics', {
  session_id: uuid('session_id').primaryKey().references(() => sessions.id, { onDelete: 'cascade' }),
  tutor_talk_ratio: decimal('tutor_talk_ratio', { precision: 4, scale: 3 }),
  student_talk_ratio: decimal('student_talk_ratio', { precision: 4, scale: 3 }),
  productive_silence_ratio: decimal('productive_silence_ratio', { precision: 4, scale: 3 }),
  awkward_pause_ratio: decimal('awkward_pause_ratio', { precision: 4, scale: 3 }),
  student_engagement_score: decimal('student_engagement_score', { precision: 3, scale: 1 }),
  tutor_enthusiasm_score: decimal('tutor_enthusiasm_score', { precision: 3, scale: 1 }),
  avg_student_response_delay: decimal('avg_student_response_delay', { precision: 5, scale: 2 }), // seconds
  long_pauses_count: integer('long_pauses_count').notNull().default(0),
  student_initiated_questions: integer('student_initiated_questions').notNull().default(0),
  student_frustration_count: integer('student_frustration_count').notNull().default(0),
  student_confusion_count: integer('student_confusion_count').notNull().default(0),
  positive_moments_count: integer('positive_moments_count').notNull().default(0),
  tutor_checks_understanding_count: integer('tutor_checks_understanding_count').notNull().default(0),
  tutor_positive_reinforcement_count: integer('tutor_positive_reinforcement_count').notNull().default(0),
  concept_re_explanation_count: integer('concept_re_explanation_count').notNull().default(0),
  open_ended_questions: integer('open_ended_questions').notNull().default(0),
  closed_ended_questions: integer('closed_ended_questions').notNull().default(0),
  rhetorical_questions: integer('rhetorical_questions').notNull().default(0),
  created_at: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  tutorRatioCheck: check('tutor_ratio_check', sql`${table.tutor_talk_ratio} >= 0 AND ${table.tutor_talk_ratio} <= 1`),
  studentRatioCheck: check('student_ratio_check', sql`${table.student_talk_ratio} >= 0 AND ${table.student_talk_ratio} <= 1`),
}));

// Session video metrics (optional)
export const sessionVideoMetrics = pgTable('session_video_metrics', {
  session_id: uuid('session_id').primaryKey().references(() => sessions.id, { onDelete: 'cascade' }),
  student_on_screen_attention_pct: decimal('student_on_screen_attention_pct', { precision: 4, scale: 3 }),
  student_visual_engagement_score: decimal('student_visual_engagement_score', { precision: 3, scale: 1 }),
  distraction_events_count: integer('distraction_events_count').notNull().default(0),
  confusion_moments_count: integer('confusion_moments_count').notNull().default(0),
  tutor_uses_visual_aids: boolean('tutor_uses_visual_aids').notNull().default(false),
  student_taking_notes_duration: integer('student_taking_notes_duration').notNull().default(0), // minutes
  created_at: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  attentionCheck: check('attention_check', sql`${table.student_on_screen_attention_pct} >= 0 AND ${table.student_on_screen_attention_pct} <= 1`),
}));

// Session screen metrics (optional)
export const sessionScreenMetrics = pgTable('session_screen_metrics', {
  session_id: uuid('session_id').primaryKey().references(() => sessions.id, { onDelete: 'cascade' }),
  active_tab_focus_pct: decimal('active_tab_focus_pct', { precision: 4, scale: 3 }),
  tab_switches_count: integer('tab_switches_count').notNull().default(0),
  whiteboard_usage_minutes: integer('whiteboard_usage_minutes').notNull().default(0),
  messaging_app_detected: boolean('messaging_app_detected').notNull().default(false),
  gaming_detected: boolean('gaming_detected').notNull().default(false),
  created_at: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  focusCheck: check('focus_check', sql`${table.active_tab_focus_pct} >= 0 AND ${table.active_tab_focus_pct} <= 1`),
}));

// Session feedback (student-generated)
export const sessionFeedback = pgTable('session_feedback', {
  session_id: uuid('session_id').primaryKey().references(() => sessions.id, { onDelete: 'cascade' }),
  student_satisfaction_rating: integer('student_satisfaction_rating').notNull(),
  feedback_text: text('feedback_text'),
  submitted_at: timestamp('submitted_at').defaultNow().notNull(),
}, (table) => ({
  ratingCheck: check('rating_check', sql`${table.student_satisfaction_rating} >= 1 AND ${table.student_satisfaction_rating} <= 5`),
}));

// Session feedback tags
export const sessionFeedbackTags = pgTable('session_feedback_tags', {
  session_id: uuid('session_id').notNull().references(() => sessions.id, { onDelete: 'cascade' }),
  tag: feedbackTagEnum('tag').notNull(),
}, (table) => [
  primaryKey({ columns: [table.session_id, table.tag] }),
]);

// Session transcript highlights
export const sessionTranscriptHighlights = pgTable('session_transcript_highlights', {
  id: uuid('id').primaryKey().defaultRandom(),
  session_id: uuid('session_id').notNull().references(() => sessions.id, { onDelete: 'cascade' }),
  timestamp_seconds: integer('timestamp_seconds').notNull(),
  speaker: transcriptSpeakerEnum('speaker').notNull(),
  text: text('text').notNull(),
  highlight_type: highlightTypeEnum('highlight_type').notNull(),
});
