import { getTutorPerformanceTrends } from '../services/tutor-service';

async function testPerformanceTrends() {
  const tutorId = 'c3DI4CT14ZOeywEbDULE3tFW6erv'; // Sarah Lewis

  console.log(`Testing Performance Trends for Sarah Lewis (${tutorId})\n`);
  console.log('=' + '='.repeat(50) + '\n');

  try {
    const trends = await getTutorPerformanceTrends(tutorId, 30);

    console.log(`Found ${trends.length} data points\n`);

    // Show first 5 entries to verify decimal precision
    console.log('First 5 data points (checking decimal precision):');
    trends.slice(0, 5).forEach(trend => {
      console.log(`  Date: ${trend.date}`);
      console.log(`    Session Score: ${trend.sessionScore} (${typeof trend.sessionScore})`);
      console.log(`    Engagement: ${trend.engagement} (${typeof trend.engagement})`);
      console.log(`    Satisfaction: ${trend.satisfaction} (${typeof trend.satisfaction})`);

      // Check decimal places
      if (trend.sessionScore !== null) {
        const parts = trend.sessionScore.toString().split('.');
        const scoreDecimals = parts.length > 1 ? parts[1].length : 0;
        if (scoreDecimals > 2) {
          console.log(`    ⚠️ WARNING: Session score has ${scoreDecimals} decimal places (value: ${trend.sessionScore})`);
        }
      }
      if (trend.engagement !== null) {
        const parts = trend.engagement.toString().split('.');
        const engDecimals = parts.length > 1 ? parts[1].length : 0;
        if (engDecimals > 2) {
          console.log(`    ⚠️ WARNING: Engagement has ${engDecimals} decimal places (value: ${trend.engagement})`);
        }
      }
      if (trend.satisfaction !== null) {
        const parts = trend.satisfaction.toString().split('.');
        const satDecimals = parts.length > 1 ? parts[1].length : 0;
        if (satDecimals > 2) {
          console.log(`    ⚠️ WARNING: Satisfaction has ${satDecimals} decimal places (value: ${trend.satisfaction})`);
        }
      }
      console.log('');
    });

    // Summary
    const allValid = trends.every(trend => {
      const scoreValid = trend.sessionScore === null ||
        (trend.sessionScore.toString().split('.')[1]?.length || 0) <= 2;
      const engValid = trend.engagement === null ||
        (trend.engagement.toString().split('.')[1]?.length || 0) <= 2;
      const satValid = trend.satisfaction === null ||
        (trend.satisfaction.toString().split('.')[1]?.length || 0) <= 2;
      return scoreValid && engValid && satValid;
    });

    if (allValid) {
      console.log('✅ All values have 2 or fewer decimal places!');
    } else {
      console.log('❌ Some values have more than 2 decimal places.');
    }

  } catch (error) {
    console.error('Error:', error);
  }

  process.exit(0);
}

testPerformanceTrends();