import { pgTable, varchar, date, text, pgEnum, uuid, timestamp, primaryKey } from 'drizzle-orm/pg-core';
import { users, subjects } from './users';

// Student status enum
export const studentStatusEnum = pgEnum('student_status', ['active', 'churned', 'paused']);

// Grade level enum
export const gradeLevelEnum = pgEnum('grade_level', [
  '6th',
  '7th',
  '8th',
  '9th',
  '10th',
  '11th',
  '12th',
  'college',
  'adult',
]);

// Churn reason enum
export const churnReasonEnum = pgEnum('churn_reason', [
  'poor_first_session',
  'tutor_mismatch',
  'no_progress',
  'scheduling_difficulty',
  'price_concerns',
  'technical_issues',
  'found_competitor',
  'completed_goals',
  'personal_circumstances',
  'other',
]);

// Students table
export const students = pgTable('students', {
  user_id: varchar('user_id', { length: 128 }).primaryKey().references(() => users.id, { onDelete: 'cascade' }),
  enrolled_since: date('enrolled_since').notNull().defaultNow(),
  grade_level: gradeLevelEnum('grade_level'),
  parent_email: varchar('parent_email', { length: 255 }),
  bio: text('bio'),
  learning_goals: text('learning_goals'),
  status: studentStatusEnum('status').notNull().default('active'),
  churned_date: date('churned_date'),
  churn_survey_response: text('churn_survey_response'),
});

// Junction table for student-subject relationships
export const studentSubjects = pgTable('student_subjects', {
  student_id: varchar('student_id', { length: 128 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  subject_id: uuid('subject_id').notNull().references(() => subjects.id, { onDelete: 'cascade' }),
}, (table) => [
  primaryKey({ columns: [table.student_id, table.subject_id] }),
]);

// Student churn reasons (multiple reasons can be assigned)
export const studentChurnReasons = pgTable('student_churn_reasons', {
  student_id: varchar('student_id', { length: 128 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  reason: churnReasonEnum('reason').notNull(),
  added_at: timestamp('added_at').defaultNow().notNull(),
}, (table) => [
  primaryKey({ columns: [table.student_id, table.reason] }),
]);
