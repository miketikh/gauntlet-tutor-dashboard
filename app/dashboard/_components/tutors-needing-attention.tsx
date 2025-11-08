import { getTutorsNeedingAttention } from '@/services/dashboard';
import { ScoreBadge } from '@/components/ui/score-badge';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { AlertCircle, CheckCircle } from 'lucide-react';
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
    <div className="space-y-2">
      {tutors.map((tutor) => {
        const isCritical = tutor.active_alert_count > 0 || tutor.overall_score < 5;

        return (
          <Link
            key={tutor.user_id}
            href={`/dashboard/tutors/${tutor.user_id}`}
            className="block"
          >
            <div
              className={cn(
                'flex items-center gap-3 rounded-lg border bg-card p-3 transition-colors hover:bg-accent',
                isCritical
                  ? 'border-l-4 border-l-destructive'
                  : 'border-l-4 border-l-yellow-500'
              )}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
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
                <div className="flex items-center gap-2 mt-1">
                  <ScoreBadge score={tutor.overall_score} size="sm" />
                  {tutor.active_alert_count > 0 && (
                    <Badge variant="destructive" className="text-xs">
                      {tutor.active_alert_count} alert{tutor.active_alert_count > 1 ? 's' : ''}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
