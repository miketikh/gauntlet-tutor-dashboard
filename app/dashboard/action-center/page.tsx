import { Suspense } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ActionCenterStats } from './_components/action-center-stats';
import { ActionCenterFilters } from './_components/action-center-filters';
import { ActionableAlertCard } from './_components/actionable-alert-card';
import { ActionableInsightCard } from './_components/actionable-insight-card';
import { getActionableAlerts, getActionableInsights } from '@/services/dashboard';
import { LoadingCard } from '@/components/ui/loading-card';
import { EmptyState } from '@/components/ui/empty-state';
import { CheckCircle, AlertCircle, TrendingUp } from 'lucide-react';

type ActionCenterPageProps = {
  searchParams: Promise<{
    tab?: string;
    severity?: 'critical' | 'warning' | 'info';
    type?: 'growth_area' | 'strength' | 'achievement';
  }>;
};

export default async function ActionCenterPage({ searchParams }: ActionCenterPageProps) {
  const params = await searchParams;
  const activeTab = params.tab || 'alerts';
  const severityFilter = params.severity;
  const typeFilter = params.type;

  // Fetch alerts and insights based on filters
  const [alerts, insights] = await Promise.all([
    getActionableAlerts(severityFilter, 50),
    getActionableInsights(typeFilter, 50),
  ]);

  return (
    <>
      <PageHeader
        title="Action Center"
        description="Monitor and respond to critical alerts, warnings, and growth opportunities across all tutors"
      />

      {/* Stats Overview */}
      <div className="mb-8">
        <Suspense fallback={
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <LoadingCard variant="metric" />
            <LoadingCard variant="metric" />
            <LoadingCard variant="metric" />
            <LoadingCard variant="metric" />
          </div>
        }>
          <ActionCenterStats />
        </Suspense>
      </div>

      {/* Tabs for Alerts and Insights */}
      <Tabs defaultValue={activeTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="alerts" className="gap-2">
            <AlertCircle className="h-4 w-4" />
            Alerts ({alerts.length})
          </TabsTrigger>
          <TabsTrigger value="insights" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            Insights ({insights.length})
          </TabsTrigger>
        </TabsList>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">
              Active Alerts
            </h3>
            <ActionCenterFilters view="alerts" />
          </div>

          {alerts.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {alerts.map((alert) => (
                <ActionableAlertCard key={alert.id} alert={alert} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={CheckCircle}
              title="No active alerts"
              description={
                severityFilter
                  ? `No ${severityFilter} alerts found. Try adjusting your filters.`
                  : 'All alerts have been resolved. Great work!'
              }
              className="border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-950/50"
            />
          )}
        </TabsContent>

        {/* Insights Tab */}
        <TabsContent value="insights" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">
              Actionable Insights
            </h3>
            <ActionCenterFilters view="insights" />
          </div>

          {insights.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {insights.map((insight) => (
                <ActionableInsightCard key={insight.id} insight={insight} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={CheckCircle}
              title="No insights available"
              description={
                typeFilter
                  ? `No ${typeFilter.replace('_', ' ')} insights found. Try adjusting your filters.`
                  : 'No active insights at this time. Check back later.'
              }
            />
          )}
        </TabsContent>
      </Tabs>
    </>
  );
}
