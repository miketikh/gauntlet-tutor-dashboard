'use client';

import { ActionableAlert } from '@/services/dashboard';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScoreBadge } from '@/components/ui/score-badge';
import { AlertCircle, AlertTriangle, Info, Clock } from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

interface ActionableAlertCardProps {
  alert: ActionableAlert;
}

export function ActionableAlertCard({ alert }: ActionableAlertCardProps) {
  const router = useRouter();
  const severityConfig = {
    critical: {
      icon: AlertCircle,
      bgColor: 'bg-red-50 dark:bg-red-950/30',
      borderColor: 'border-l-red-500',
      textColor: 'text-red-700 dark:text-red-400',
      badgeVariant: 'destructive' as const,
    },
    warning: {
      icon: AlertTriangle,
      bgColor: 'bg-yellow-50 dark:bg-yellow-950/30',
      borderColor: 'border-l-yellow-500',
      textColor: 'text-yellow-700 dark:text-yellow-400',
      badgeVariant: 'outline' as const,
    },
    info: {
      icon: Info,
      bgColor: 'bg-blue-50 dark:bg-blue-950/30',
      borderColor: 'border-l-blue-500',
      textColor: 'text-blue-700 dark:text-blue-400',
      badgeVariant: 'outline' as const,
    },
  };

  const config = severityConfig[alert.severity];
  const Icon = config.icon;

  return (
    <Card
      className={cn(
        'border-l-4 transition-all hover:shadow-md hover:border-primary/50 cursor-pointer',
        config.borderColor,
        config.bgColor
      )}
      onClick={() => router.push(`/dashboard/tutors/${alert.tutor_id}`)}
    >
        <CardContent className="p-4">
          {/* Header: Tutor name, score, severity badge */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <Icon className={cn('h-4 w-4 shrink-0', config.textColor)} />
              <div className="flex items-center gap-2 min-w-0 flex-wrap">
                <span className="font-semibold text-foreground truncate">
                  {alert.tutor_name}
                </span>
                {alert.overall_score !== null && (
                  <ScoreBadge score={alert.overall_score} size="sm" />
                )}
                {alert.churn_risk_level !== 'low' && (
                  <Badge variant="outline" className="text-xs border-orange-500 text-orange-700 dark:text-orange-400">
                    {alert.churn_risk_level} risk
                  </Badge>
                )}
              </div>
            </div>
            <Badge variant={config.badgeVariant} className="shrink-0 capitalize">
              {alert.severity}
            </Badge>
          </div>

          {/* Alert Title */}
          <h4 className="font-medium text-foreground mb-1">{alert.title}</h4>

          {/* Alert Description */}
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
            {alert.description}
          </p>

          {/* Footer: Timestamp and session link */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{formatDistanceToNow(alert.triggered_date, { addSuffix: true })}</span>
            </div>
            {alert.session_id && (
              <Link
                href={`/dashboard/sessions/${alert.session_id}`}
                className="hover:text-primary hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                View Session
              </Link>
            )}
          </div>
        </CardContent>
      </Card>
  );
}
