import { getPlatformMetrics } from '@/services/dashboard';
import { StatGrid, type StatItem } from '@/components/ui/stat-grid';
import { BarChart3, UserCheck, AlertTriangle, Clock } from 'lucide-react';
import { formatScore, formatPercentage } from '@/lib/utils/formatting';
import Link from 'next/link';
import { MetricCard } from '@/components/ui/metric-card';

export async function PlatformMetricsBar() {
  const metrics = await getPlatformMetrics();

  // Determine variant for Tutor Churn Risk Count based on count
  let churnRiskVariant: 'default' | 'warning' | 'danger' = 'default';
  if (metrics.tutorChurnRiskCount > 10) {
    churnRiskVariant = 'danger';
  } else if (metrics.tutorChurnRiskCount > 5) {
    churnRiskVariant = 'warning';
  }

  const regularStats: StatItem[] = [
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
  ];

  const noShowStat: StatItem = {
    label: 'No-Show Rate',
    value: formatPercentage(metrics.noShowRate, 1),
    icon: Clock,
    trend: metrics.noShowRateTrend,
    description: 'vs previous 30 days',
  };

  return (
    <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
      {regularStats.map((stat, index) => (
        <MetricCard
          key={index}
          title={stat.label}
          value={stat.value}
          icon={stat.icon}
          trend={stat.trend}
          trendValue={stat.trendValue}
          description={stat.description}
          variant={stat.variant}
        />
      ))}
      <Link href="/dashboard/tutors?churnRisk=high,medium" className="block">
        <MetricCard
          title="Tutor Churn Risk Count"
          value={metrics.tutorChurnRiskCount}
          icon={AlertTriangle}
          variant={churnRiskVariant}
          description="tutors at risk"
          className="h-full transition-shadow hover:shadow-md cursor-pointer"
        />
      </Link>
      <MetricCard
        title={noShowStat.label}
        value={noShowStat.value}
        icon={noShowStat.icon}
        trend={noShowStat.trend}
        trendValue={noShowStat.trendValue}
        description={noShowStat.description}
        variant={noShowStat.variant}
      />
    </div>
  );
}
