import { pgTable, uuid, varchar, text, timestamp, boolean, pgEnum, date, integer, decimal, jsonb, check } from 'drizzle-orm/pg-core';
import { users } from './users';
import { sessions } from './sessions';
import { sql } from 'drizzle-orm';

// Alert type enum
export const alertTypeEnum = pgEnum('alert_type', [
  'high_talk_ratio',
  'low_understanding_checks',
  'student_frustration_detected',
  'poor_first_session',
  'high_reschedule_rate',
  'no_show_pattern',
  'declining_performance',
  'student_churn_risk',
]);

// Alert severity enum
export const alertSeverityEnum = pgEnum('alert_severity', ['info', 'warning', 'critical']);

// Achievement type enum
export const achievementTypeEnum = pgEnum('achievement_type', [
  'engagement_master',
  'question_guru',
  'first_session_expert',
  'consistency_champion',
  'student_favorite',
  'rising_star',
]);

// Alerts table
export const alerts = pgTable('alerts', {
  id: uuid('id').primaryKey().defaultRandom(),
  tutor_id: varchar('tutor_id', { length: 128 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  alert_type: alertTypeEnum('alert_type').notNull(),
  severity: alertSeverityEnum('severity').notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description').notNull(),
  triggered_date: timestamp('triggered_date').defaultNow().notNull(),
  session_id: uuid('session_id').references(() => sessions.id, { onDelete: 'set null' }),
  acknowledged: boolean('acknowledged').notNull().default(false),
  acknowledged_by: varchar('acknowledged_by', { length: 128 }).references(() => users.id, { onDelete: 'set null' }),
  acknowledged_at: timestamp('acknowledged_at'),
  action_taken: text('action_taken'),
  resolved: boolean('resolved').notNull().default(false),
  resolved_at: timestamp('resolved_at'),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Achievements table
export const achievements = pgTable('achievements', {
  id: uuid('id').primaryKey().defaultRandom(),
  tutor_id: varchar('tutor_id', { length: 128 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  achievement_type: achievementTypeEnum('achievement_type').notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description').notNull(),
  icon: varchar('icon', { length: 50 }).notNull(),
  earned_date: date('earned_date').notNull(),
  is_active: boolean('is_active').notNull().default(true),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Churn algorithm weights
export const churnAlgorithmWeights = pgTable('churn_algorithm_weights', {
  id: uuid('id').primaryKey().defaultRandom(),
  version: integer('version').notNull(),
  factor_category: varchar('factor_category', { length: 50 }).notNull(),
  weight: decimal('weight', { precision: 4, scale: 3 }).notNull(),
  effective_from: timestamp('effective_from').defaultNow().notNull(),
  notes: text('notes'),
  created_at: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  weightCheck: check('weight_check', sql`${table.weight} >= 0 AND ${table.weight} <= 1`),
}));

// Churn weight history (tracks changes)
export const churnWeightHistory = pgTable('churn_weight_history', {
  id: uuid('id').primaryKey().defaultRandom(),
  version: integer('version').notNull(),
  changed_by: varchar('changed_by', { length: 128 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  change_reason: text('change_reason').notNull(),
  case_study_session_id: uuid('case_study_session_id').references(() => sessions.id, { onDelete: 'set null' }),
  case_study_student_id: varchar('case_study_student_id', { length: 128 }).references(() => users.id, { onDelete: 'set null' }),
  old_weights: jsonb('old_weights').notNull(),
  new_weights: jsonb('new_weights').notNull(),
  accuracy_before: decimal('accuracy_before', { precision: 4, scale: 3 }),
  accuracy_after: decimal('accuracy_after', { precision: 4, scale: 3 }),
  created_at: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  accuracyBeforeCheck: check('accuracy_before_check', sql`${table.accuracy_before} >= 0 AND ${table.accuracy_before} <= 1`),
  accuracyAfterCheck: check('accuracy_after_check', sql`${table.accuracy_after} >= 0 AND ${table.accuracy_after} <= 1`),
}));
