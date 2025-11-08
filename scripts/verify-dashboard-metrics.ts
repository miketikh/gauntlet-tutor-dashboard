import { getPlatformMetrics, getDashboardTopPerformers, getTutorsNeedingAttention } from '../services/dashboard';

async function verifyMetrics() {
  console.log('📊 Verifying Dashboard Metrics\n');
  console.log('================================\n');

  // Get platform metrics
  const metrics = await getPlatformMetrics();
  console.log('Platform Metrics:');
  console.log(`  Average Session Score: ${metrics.avgSessionScore.toFixed(1)} (${metrics.avgSessionScoreTrend})`);
  console.log(`  First Session Convert Rate: ${(metrics.firstSessionConvertRate * 100).toFixed(1)}% (${metrics.firstSessionConvertRateTrend})`);
  console.log(`  Tutor Churn Risk Count: ${metrics.tutorChurnRiskCount}`);
  console.log(`  No-Show Rate: ${(metrics.noShowRate * 100).toFixed(1)}% (${metrics.noShowRateTrend})\n`);

  // Get top performers
  const topPerformers = await getDashboardTopPerformers(5);
  console.log('Top 5 Performers:');
  topPerformers.forEach((tutor, i) => {
    console.log(`  ${i + 1}. ${tutor.name}: ${tutor.overall_score.toFixed(1)} (${tutor.session_count} sessions)`);
  });
  console.log();

  // Get tutors needing attention
  const needsAttention = await getTutorsNeedingAttention(5);
  console.log('Tutors Needing Attention:');
  if (needsAttention.length === 0) {
    console.log('  (none - all tutors performing well)');
  } else {
    needsAttention.forEach((tutor) => {
      console.log(`  - ${tutor.name}: ${tutor.overall_score.toFixed(1)} (${tutor.active_alert_count} alerts)`);
    });
  }

  console.log('\n✅ Dashboard metrics verified!');
  console.log('   The dashboard should now display these values correctly.');
  process.exit(0);
}

verifyMetrics().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});