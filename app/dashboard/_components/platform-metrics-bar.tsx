import { getPlatformMetrics } from '@/services/dashboard';
import { StatGrid, type StatItem } from '@/components/ui/stat-grid';
import { BarChart3, UserCheck, AlertTriangle, Clock } from 'lucide-react';
import { formatScore, formatPercentage } from '@/lib/utils/formatting';

export async function PlatformMetricsBar() {
  const metrics = await getPlatformMetrics();

  // Determine variant for Tutor Churn Risk Count based on count
  let churnRiskVariant: 'default' | 'warning' | 'danger' = 'default';
  if (metrics.tutorChurnRiskCount > 10) {
    churnRiskVariant = 'danger';
  } else if (metrics.tutorChurnRiskCount > 5) {
    churnRiskVariant = 'warning';
  }

  const stats: StatItem[] = [
    {
      label: 'Avg Session Score',
      value: formatScore(metrics.avgSessionScore),
      icon: BarChart3,
      trend: metrics.avgSessionScoreTrend,
      description: 'vs previous 30 days',
    },
    {
      label: 'First Session Convert Rate',
      value: formatPercentage(metrics.firstSessionConvertRate, 1),
      icon: UserCheck,
      trend: metrics.firstSessionConvertRateTrend,
      description: 'vs previous 30 days',
    },
    {
      label: 'Tutor Churn Risk Count',
      value: metrics.tutorChurnRiskCount,
      icon: AlertTriangle,
      variant: churnRiskVariant,
      description: 'tutors at risk',
    },
    {
      label: 'No-Show Rate',
      value: formatPercentage(metrics.noShowRate, 1),
      icon: Clock,
      trend: metrics.noShowRateTrend,
      description: 'vs previous 30 days',
    },
  ];

  return <StatGrid stats={stats} columns={4} />;
}
