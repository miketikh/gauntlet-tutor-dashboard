import { pgTable, varchar, timestamp, uuid, pgEnum } from 'drizzle-orm/pg-core';

// User role enum
export const userRoleEnum = pgEnum('user_role', ['admin', 'tutor', 'student']);

// Subject category enum
export const subjectCategoryEnum = pgEnum('subject_category', [
  'math',
  'science',
  'language_arts',
  'social_studies',
  'foreign_language',
  'test_prep',
  'computer_science',
  'arts',
  'other',
]);

// Users table
export const users = pgTable('users', {
  id: varchar('id', { length: 128 }).primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  preferred_name: varchar('preferred_name', { length: 255 }),
  avatar_url: varchar('avatar_url', { length: 500 }),
  role: userRoleEnum('role').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Subjects table
export const subjects = pgTable('subjects', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull().unique(),
  category: subjectCategoryEnum('category').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});
