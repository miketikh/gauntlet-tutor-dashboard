import { pgTable, uuid, varchar, timestamp, integer, boolean, text, decimal, pgEnum, check } from 'drizzle-orm/pg-core';
import { users, subjects } from './users';
import { sql } from 'drizzle-orm';

// Session status enum
export const sessionStatusEnum = pgEnum('session_status', [
  'scheduled',
  'in_progress',
  'completed',
  'no_show_tutor',
  'no_show_student',
  'cancelled',
  'rescheduled',
]);

// Reschedule by enum
export const rescheduleByEnum = pgEnum('reschedule_by', ['tutor', 'student']);

// Sessions table
export const sessions = pgTable('sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  tutor_id: varchar('tutor_id', { length: 128 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  student_id: varchar('student_id', { length: 128 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  scheduled_start: timestamp('scheduled_start').notNull(),
  actual_start: timestamp('actual_start'),
  scheduled_duration: integer('scheduled_duration').notNull(), // minutes
  actual_duration: integer('actual_duration'), // minutes
  subject_id: uuid('subject_id').notNull().references(() => subjects.id),
  session_number: integer('session_number').notNull(), // nth session for this tutor-student pair
  status: sessionStatusEnum('status').notNull().default('scheduled'),
  tutor_showed_up: boolean('tutor_showed_up').notNull().default(true),
  student_showed_up: boolean('student_showed_up').notNull().default(true),
  rescheduled_by: rescheduleByEnum('rescheduled_by'),
  technical_issues: boolean('technical_issues').notNull().default(false),
  technical_issues_description: text('technical_issues_description'),
  has_audio_analysis: boolean('has_audio_analysis').notNull().default(false),
  has_video_analysis: boolean('has_video_analysis').notNull().default(false),
  has_screen_monitoring: boolean('has_screen_monitoring').notNull().default(false),
  homework_assigned: boolean('homework_assigned').notNull().default(false),
  follow_up_booked: boolean('follow_up_booked').notNull().default(false),
  overall_session_score: decimal('overall_session_score', { precision: 3, scale: 1 }),
  ai_summary: text('ai_summary'),
  completed_at: timestamp('completed_at'),
  created_at: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  scoreCheck: check('score_check', sql`${table.overall_session_score} >= 0 AND ${table.overall_session_score} <= 10`),
}));
