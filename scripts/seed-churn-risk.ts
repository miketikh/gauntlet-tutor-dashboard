#!/usr/bin/env tsx
// Incremental seed script to add churn risk sessions for tutors
// This script adds 2 no-show sessions to push 2 tutors over the churn risk threshold

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { config } from 'dotenv';
import { sessions } from '../lib/db/schema/sessions';

// Load environment variables
config({ path: '.env.local' });

async function seedChurnRisk() {
  console.log('🌱 Adding churn risk sessions...\n');

  // Initialize database connection
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set in environment variables');
  }

  const sql = postgres(connectionString);
  const db = drizzle(sql);

  try {
    // Session 1: Alexander White (struggling tutor) no-show with Sophia King
    // This is his 6th session with this student, pushing him to 2 no-shows total
    const session1 = {
      tutor_id: 'otajlPvxjE2fw7e8lLC6O8Lvd0Vi',
      student_id: 'IYYgXXKRK1kvjkaLU1uDH9sQ2C9U',
      scheduled_start: new Date('2025-11-05T19:00:00'), // Nov 5, 7pm - realistic evening tutoring time
      actual_start: null,
      scheduled_duration: 60,
      actual_duration: null,
      subject_id: 'd55f952a-8522-47cd-867a-0e3060845dd2', // Pre-Calculus (from existing sessions)
      session_number: 6,
      status: 'no_show_tutor' as const,
      tutor_showed_up: false,
      student_showed_up: true,
      rescheduled_by: null,
      technical_issues: false,
      technical_issues_description: null,
      has_audio_analysis: false,
      has_video_analysis: false,
      has_screen_monitoring: false,
      homework_assigned: false,
      follow_up_booked: false,
      overall_session_score: null,
      ai_summary: null,
      completed_at: null,
      created_at: new Date('2025-11-02T10:00:00'), // Scheduled 3 days prior - realistic booking pattern
    };

    // Session 2: Liam Williams (at-risk tutor) no-show with Noah Miller
    // This is his 3rd session with this student, pushing him to 2 no-shows total
    const session2 = {
      tutor_id: 'ivGimc2QgW9mCvlt6Z5ePnjQpA2q',
      student_id: 'VQNwY0AglScbtPI3DNRAal0HDj7a',
      scheduled_start: new Date('2025-11-03T16:30:00'), // Nov 3, 4:30pm - realistic afternoon time
      actual_start: null,
      scheduled_duration: 45,
      actual_duration: null,
      subject_id: 'a2c7f76c-72d3-44a1-aa27-abe530a2962f', // Algebra (from existing sessions)
      session_number: 3,
      status: 'no_show_tutor' as const,
      tutor_showed_up: false,
      student_showed_up: true,
      rescheduled_by: null,
      technical_issues: false,
      technical_issues_description: null,
      has_audio_analysis: false,
      has_video_analysis: false,
      has_screen_monitoring: false,
      homework_assigned: false,
      follow_up_booked: false,
      overall_session_score: null,
      ai_summary: null,
      completed_at: null,
      created_at: new Date('2025-10-30T14:00:00'), // Scheduled 4 days prior - realistic booking pattern
    };

    // Insert both sessions
    console.log('📅 Inserting churn risk sessions...');

    await db.insert(sessions).values([session1, session2]);

    console.log('✅ Successfully added 2 no-show sessions\n');
    console.log('Summary:');
    console.log('  - Alexander White (otajlPvx...): Now has 2 no-shows (AT CHURN RISK)');
    console.log('  - Liam Williams (ivGimc2Q...): Now has 2 no-shows (AT CHURN RISK)');
    console.log('\n🎯 Dashboard should now show 2 tutors at churn risk!');

  } catch (error) {
    console.error('❌ Error during seed:', error);
    throw error;
  } finally {
    await sql.end();
  }
}

// Run seed if executed directly
if (require.main === module) {
  seedChurnRisk().catch(console.error);
}

export default seedChurnRisk;
