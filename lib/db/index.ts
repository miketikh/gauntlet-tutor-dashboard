import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

// Import all schemas
import * as users from './schema/users';
import * as tutors from './schema/tutors';
import * as students from './schema/students';
import * as sessions from './schema/sessions';
import * as metrics from './schema/metrics';
import * as alerts from './schema/alerts';
import * as churn from './schema/churn';

// Database connection - MUST have DATABASE_URL set
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required');
}

// Create postgres client
const client = postgres(process.env.DATABASE_URL);

// Create drizzle instance with all schemas
export const db = drizzle(client, {
  schema: {
    ...users,
    ...tutors,
    ...students,
    ...sessions,
    ...metrics,
    ...alerts,
    ...churn,
  },
});

// Export all schemas for external use
export * from './schema/users';
export * from './schema/tutors';
export * from './schema/students';
export * from './schema/sessions';
export * from './schema/metrics';
export * from './schema/alerts';
export * from './schema/churn';
export * from './types';
