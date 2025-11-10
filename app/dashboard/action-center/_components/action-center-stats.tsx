import { getActionCenterStats } from '@/services/dashboard';
import { StatGrid } from '@/components/ui/stat-grid';
import { AlertCircle, AlertTriangle, TrendingUp, Users } from 'lucide-react';

export async function ActionCenterStats() {
  const stats = await getActionCenterStats();

  return (
    <StatGrid
      columns={4}
      stats={[
        {
          label: 'Critical Alerts',
          value: stats.total_critical_alerts,
          icon: AlertCircle,
          variant: stats.total_critical_alerts > 0 ? 'danger' : 'default',
          description: 'Require immediate attention',
        },
        {
          label: 'Warnings',
          value: stats.total_warnings,
          icon: AlertTriangle,
          variant: stats.total_warnings > 5 ? 'warning' : 'default',
          description: 'Monitor closely',
        },
        {
          label: 'Growth Opportunities',
          value: stats.total_growth_opportunities,
          icon: TrendingUp,
          description: 'Areas for improvement',
        },
        {
          label: 'Tutors at Risk',
          value: stats.tutors_at_risk,
          icon: Users,
          variant: stats.tutors_at_risk > 0 ? 'warning' : 'default',
          description: 'High churn risk',
        },
      ]}
    />
  );
}
