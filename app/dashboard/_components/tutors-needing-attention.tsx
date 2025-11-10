import { getTutorsNeedingAttention } from '@/services/dashboard';
import { ScoreBadge } from '@/components/ui/score-badge';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { AlertCircle, CheckCircle, AlertTriangle, TrendingUp, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export async function TutorsNeedingAttention() {
  const tutors = await getTutorsNeedingAttention(3);

  if (tutors.length === 0) {
    return (
      <EmptyState
        icon={CheckCircle}
        title="All tutors performing well!"
        description="No tutors currently need attention. Great work!"
        className="border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-950/50"
      />
    );
  }

  return (
    <div className="space-y-3">
      {tutors.map((tutor) => {
        const isCritical = tutor.active_alert_count > 0 || tutor.overall_score < 5;
        const hasInsights = tutor.top_alerts.length > 0 || tutor.top_insights.length > 0;

        return (
          <Link
            key={tutor.user_id}
            href={`/dashboard/tutors/${tutor.user_id}`}
            className="block"
          >
            <div
              className={cn(
                'rounded-lg border bg-card p-3 transition-colors hover:bg-accent',
                isCritical
                  ? 'border-l-4 border-l-destructive'
                  : 'border-l-4 border-l-yellow-500'
              )}
            >
              {/* Header */}
              <div className="flex items-center justify-between gap-3 mb-2">
                <div className="flex items-center gap-2 min-w-0">
                  <p className="font-medium text-foreground truncate">
                    {tutor.name}
                  </p>
                  {(tutor.churn_risk_level === 'medium' || tutor.churn_risk_level === 'high') && (
                    <span className="text-sm shrink-0" title={`${tutor.churn_risk_level} churn risk`}>⚠️</span>
                  )}
                  {isCritical && (
                    <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
                  )}
                </div>
                <ScoreBadge score={tutor.overall_score} size="sm" />
              </div>

              {/* Alerts and Insights */}
              {hasInsights && (
                <div className="space-y-1.5 mt-2">
                  {/* Top Alerts */}
                  {tutor.top_alerts.slice(0, 2).map((alert) => (
                    <div
                      key={alert.id}
                      className={cn(
                        'flex items-start gap-2 text-xs p-2 rounded',
                        alert.severity === 'critical'
                          ? 'bg-destructive/10 text-destructive'
                          : 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-500'
                      )}
                    >
                      <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <span className="font-medium">{alert.title}:</span>{' '}
                        <span className="text-muted-foreground">{alert.description}</span>
                      </div>
                    </div>
                  ))}

                  {/* Top Growth Insights */}
                  {tutor.top_insights
                    .filter(i => i.insight_type === 'growth_area')
                    .slice(0, 1)
                    .map((insight) => (
                      <div
                        key={insight.id}
                        className="flex items-start gap-2 text-xs p-2 rounded bg-blue-500/10 text-blue-700 dark:text-blue-400"
                      >
                        <TrendingUp className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                        <span className="flex-1 min-w-0">{insight.display_text}</span>
                      </div>
                    ))}
                </div>
              )}

              {/* Badge showing total count if more than shown */}
              {tutor.active_alert_count > 2 && (
                <div className="mt-2">
                  <Badge variant="outline" className="text-xs">
                    +{tutor.active_alert_count - 2} more alerts
                  </Badge>
                </div>
              )}
            </div>
          </Link>
        );
      })}
    </div>
  );
}
