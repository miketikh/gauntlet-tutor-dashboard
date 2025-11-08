import { pgTable, varchar, date, text, decimal, uuid, timestamp, boolean, integer, pgEnum, primaryKey } from 'drizzle-orm/pg-core';
import { users, subjects } from './users';

// Tutor performance snapshot period enum
export const snapshotPeriodEnum = pgEnum('snapshot_period', ['daily', 'weekly']);

// Insight type enum
export const insightTypeEnum = pgEnum('insight_type', ['strength', 'growth_area', 'achievement']);

// Insight category enum
export const insightCategoryEnum = pgEnum('insight_category', [
  'high_engagement',
  'low_engagement',
  'high_talk_ratio',
  'balanced_talk_ratio',
  'frequent_understanding_checks',
  'infrequent_understanding_checks',
  'strong_questioning',
  'low_visual_aids',
  'high_visual_aids',
  'positive_reinforcement',
  'first_session_expert',
]);

// Coaching note type enum
export const coachingNoteTypeEnum = pgEnum('coaching_note_type', ['manual', 'system']);

// Tutors table
export const tutors = pgTable('tutors', {
  user_id: varchar('user_id', { length: 128 }).primaryKey().references(() => users.id, { onDelete: 'cascade' }),
  member_since: date('member_since').notNull().defaultNow(),
  bio: text('bio'),
  experience: text('experience'),
  education: text('education'),
  teaching_style: text('teaching_style'),
  hourly_rate: decimal('hourly_rate', { precision: 6, scale: 2 }),
});

// Junction table for tutor-subject relationships
export const tutorSubjects = pgTable('tutor_subjects', {
  tutor_id: varchar('tutor_id', { length: 128 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  subject_id: uuid('subject_id').notNull().references(() => subjects.id, { onDelete: 'cascade' }),
}, (table) => [
  primaryKey({ columns: [table.tutor_id, table.subject_id] }),
]);

// Tutor performance snapshots (pre-aggregated data)
export const tutorPerformanceSnapshots = pgTable('tutor_performance_snapshots', {
  id: uuid('id').primaryKey().defaultRandom(),
  tutor_id: varchar('tutor_id', { length: 128 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  snapshot_date: date('snapshot_date').notNull(),
  period_type: snapshotPeriodEnum('period_type').notNull(),
  sessions_count: integer('sessions_count').notNull().default(0),
  avg_session_score: decimal('avg_session_score', { precision: 3, scale: 2 }),
  avg_engagement_score: decimal('avg_engagement_score', { precision: 3, scale: 2 }),
  avg_student_satisfaction: decimal('avg_student_satisfaction', { precision: 3, scale: 2 }),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Tutor insights (cached analysis)
export const tutorInsights = pgTable('tutor_insights', {
  id: uuid('id').primaryKey().defaultRandom(),
  tutor_id: varchar('tutor_id', { length: 128 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  insight_type: insightTypeEnum('insight_type').notNull(),
  category: insightCategoryEnum('category').notNull(),
  display_text: text('display_text').notNull(),
  detected_at: timestamp('detected_at').defaultNow().notNull(),
  last_confirmed_at: timestamp('last_confirmed_at'),
  is_active: boolean('is_active').notNull().default(true),
  resolved_at: timestamp('resolved_at'),
  sample_sessions: uuid('sample_sessions').array(),
  metric_value: decimal('metric_value', { precision: 5, scale: 2 }),
});

// Coaching notes (intervention log)
export const coachingNotes = pgTable('coaching_notes', {
  id: uuid('id').primaryKey().defaultRandom(),
  tutor_id: varchar('tutor_id', { length: 128 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  note_type: coachingNoteTypeEnum('note_type').notNull(),
  content: text('content').notNull(),
  created_by: varchar('created_by', { length: 128 }).references(() => users.id, { onDelete: 'set null' }),
  created_at: timestamp('created_at').defaultNow().notNull(),
});
