import { db } from '../lib/db';
import { sessions, users } from '../lib/db';
import { eq, sql, count } from 'drizzle-orm';

async function checkData() {
  try {
    // Count sessions
    const sessionCount = await db.select({ count: count() }).from(sessions);
    console.log('Total sessions:', sessionCount[0].count);

    // Count users by role
    const userCountResult = await db.select({
      role: users.role,
      count: count()
    })
    .from(users)
    .groupBy(users.role);

    console.log('Users by role:');
    userCountResult.forEach(row => {
      console.log(`  ${row.role}: ${row.count}`);
    });

    // Check for completed sessions with scores
    const completedSessionsWithScores = await db.select({
      count: count(),
      avgScore: sql<number>`AVG(${sessions.overall_session_score})`
    })
    .from(sessions)
    .where(eq(sessions.status, 'completed'));

    console.log('\nCompleted sessions:', completedSessionsWithScores[0].count);
    console.log('Average session score:', completedSessionsWithScores[0].avgScore || 'NULL');

    // Sample a few sessions to see what's in them
    const sampleSessions = await db.select({
      id: sessions.id,
      status: sessions.status,
      score: sessions.overall_session_score,
      tutor_id: sessions.tutor_id,
      scheduled_start: sessions.scheduled_start
    })
    .from(sessions)
    .limit(5);

    console.log('\nSample sessions:');
    sampleSessions.forEach(session => {
      console.log(`  ID: ${session.id.substring(0, 8)}... Status: ${session.status}, Score: ${session.score}, Date: ${session.scheduled_start}`);
    });

  } catch (error) {
    console.error('Error checking data:', error);
  }
  process.exit(0);
}

checkData();