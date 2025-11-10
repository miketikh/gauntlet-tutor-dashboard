'use client';

import { ActionableInsight } from '@/services/dashboard';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScoreBadge } from '@/components/ui/score-badge';
import { TrendingUp, Sparkles, Award, Clock } from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

interface ActionableInsightCardProps {
  insight: ActionableInsight;
}

export function ActionableInsightCard({ insight }: ActionableInsightCardProps) {
  const router = useRouter();
  const insightConfig = {
    growth_area: {
      icon: TrendingUp,
      bgColor: 'bg-blue-50 dark:bg-blue-950/30',
      borderColor: 'border-l-blue-500',
      textColor: 'text-blue-700 dark:text-blue-400',
      badgeText: 'Growth',
      badgeClass: 'border-blue-500 text-blue-700 dark:text-blue-400',
    },
    strength: {
      icon: Sparkles,
      bgColor: 'bg-green-50 dark:bg-green-950/30',
      borderColor: 'border-l-green-500',
      textColor: 'text-green-700 dark:text-green-400',
      badgeText: 'Strength',
      badgeClass: 'border-green-500 text-green-700 dark:text-green-400',
    },
    achievement: {
      icon: Award,
      bgColor: 'bg-purple-50 dark:bg-purple-950/30',
      borderColor: 'border-l-purple-500',
      textColor: 'text-purple-700 dark:text-purple-400',
      badgeText: 'Achievement',
      badgeClass: 'border-purple-500 text-purple-700 dark:text-purple-400',
    },
  };

  const config = insightConfig[insight.insight_type];
  const Icon = config.icon;

  return (
    <Card
      className={cn(
        'border-l-4 transition-all hover:shadow-md hover:border-primary/50 cursor-pointer',
        config.borderColor,
        config.bgColor
      )}
      onClick={() => router.push(`/dashboard/tutors/${insight.tutor_id}`)}
    >
        <CardContent className="p-4">
          {/* Header: Tutor name, score, insight type badge */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <Icon className={cn('h-4 w-4 shrink-0', config.textColor)} />
              <div className="flex items-center gap-2 min-w-0 flex-wrap">
                <span className="font-semibold text-foreground truncate">
                  {insight.tutor_name}
                </span>
                {insight.overall_score !== null && (
                  <ScoreBadge score={insight.overall_score} size="sm" />
                )}
                {insight.churn_risk_level !== 'low' && (
                  <Badge variant="outline" className="text-xs border-orange-500 text-orange-700 dark:text-orange-400">
                    {insight.churn_risk_level} risk
                  </Badge>
                )}
              </div>
            </div>
            <Badge variant="outline" className={cn('shrink-0', config.badgeClass)}>
              {config.badgeText}
            </Badge>
          </div>

          {/* Insight Text */}
          <p className="text-sm text-foreground mb-2 leading-relaxed">
            {insight.display_text}
            {insight.metric_value && (
              <span className="ml-1 text-muted-foreground">({insight.metric_value})</span>
            )}
          </p>

          {/* Footer: Category and timestamp */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              {insight.category && (
                <Badge variant="outline" className="text-xs">
                  {insight.category}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{formatDistanceToNow(insight.detected_at, { addSuffix: true })}</span>
            </div>
          </div>
        </CardContent>
      </Card>
  );
}
