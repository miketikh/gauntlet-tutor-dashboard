#!/usr/bin/env tsx
// Backfill script to generate alerts and insights for all existing tutors
// This script processes all tutors and calls the service layer functions to generate
// alerts and insights based on their session history

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { config } from 'dotenv';
import { users } from '../lib/db/schema/users';
import { eq } from 'drizzle-orm';
import { checkAndGenerateAlerts } from '../services/alert-service';
import { detectAndGenerateInsights } from '../services/insight-service';
import type { AlertSeverityType } from '../lib/db/types';

// Load environment variables
config({ path: '.env.local' });

interface ProcessResult {
  tutorId: string;
  tutorName: string;
  alertsCreated: number;
  insightsCreated: number;
  criticalAlerts: number;
  warningAlerts: number;
  error?: string;
}

async function backfillAlertsInsights() {
  console.log('🚀 Starting backfill of alerts and insights...\n');

  // Initialize database connection
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set in environment variables');
  }

  const sql = postgres(connectionString);
  const db = drizzle(sql);

  try {
    // Fetch all tutors from the database
    console.log('📋 Fetching all tutors from database...');
    const tutors = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
      })
      .from(users)
      .where(eq(users.role, 'tutor'));

    console.log(`✅ Found ${tutors.length} tutors to process\n`);

    if (tutors.length === 0) {
      console.log('⚠️  No tutors found in database. Exiting.');
      return;
    }

    const results: ProcessResult[] = [];
    let totalAlerts = 0;
    let totalInsights = 0;
    let tutorsWithCriticalAlerts = 0;
    let tutorsWithWarnings = 0;

    // Process each tutor
    console.log('🔄 Processing tutors...\n');
    for (let i = 0; i < tutors.length; i++) {
      const tutor = tutors[i];
      const tutorNumber = i + 1;
      const totalTutors = tutors.length;

      try {
        // Call alert generation service
        const alertsGenerated = await checkAndGenerateAlerts(tutor.id);

        // Call insight generation service
        const insightsGenerated = await detectAndGenerateInsights(tutor.id);

        // Count alert severities
        const criticalCount = alertsGenerated.filter(
          (a) => a.severity === 'critical'
        ).length;
        const warningCount = alertsGenerated.filter(
          (a) => a.severity === 'warning'
        ).length;

        // Track results
        const result: ProcessResult = {
          tutorId: tutor.id,
          tutorName: tutor.name,
          alertsCreated: alertsGenerated.length,
          insightsCreated: insightsGenerated.length,
          criticalAlerts: criticalCount,
          warningAlerts: warningCount,
        };
        results.push(result);

        // Update totals
        totalAlerts += alertsGenerated.length;
        totalInsights += insightsGenerated.length;
        if (criticalCount > 0) tutorsWithCriticalAlerts++;
        if (warningCount > 0) tutorsWithWarnings++;

        // Log progress
        console.log(
          `Tutor ${tutorNumber}/${totalTutors}: ${tutor.name} - ${alertsGenerated.length} alerts, ${insightsGenerated.length} insights generated`
        );
      } catch (error) {
        // Log error but continue processing other tutors
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(
          `❌ Error processing tutor ${tutorNumber}/${totalTutors}: ${tutor.name} - ${errorMessage}`
        );

        results.push({
          tutorId: tutor.id,
          tutorName: tutor.name,
          alertsCreated: 0,
          insightsCreated: 0,
          criticalAlerts: 0,
          warningAlerts: 0,
          error: errorMessage,
        });
      }
    }

    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 BACKFILL SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total tutors processed: ${tutors.length}`);
    console.log(`Total alerts created: ${totalAlerts}`);
    console.log(`Total insights created: ${totalInsights}`);
    console.log(`Tutors with critical alerts: ${tutorsWithCriticalAlerts}`);
    console.log(`Tutors with warnings: ${tutorsWithWarnings}`);

    const failedTutors = results.filter((r) => r.error);
    if (failedTutors.length > 0) {
      console.log(`\n⚠️  Failed to process ${failedTutors.length} tutor(s):`);
      failedTutors.forEach((r) => {
        console.log(`  - ${r.tutorName}: ${r.error}`);
      });
    }

    console.log('\n✅ Backfill completed successfully!');

  } catch (error) {
    console.error('❌ Error during backfill:', error);
    throw error;
  } finally {
    await sql.end();
  }
}

// Run backfill if executed directly
if (require.main === module) {
  backfillAlertsInsights().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export default backfillAlertsInsights;
