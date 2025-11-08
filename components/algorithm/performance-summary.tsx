"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Info,
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { AccuracyMetrics } from '@/services/churn-service';

interface PerformanceSummaryProps {
  accuracyMetrics: AccuracyMetrics;
  previousAccuracy?: number; // For trend comparison
}

export function PerformanceSummary({
  accuracyMetrics,
  previousAccuracy,
}: PerformanceSummaryProps) {
  const {
    accuracy,
    precision,
    recall,
    f1Score,
    truePositives,
    falsePositives,
    trueNegatives,
    falseNegatives,
    totalPredictions,
  } = accuracyMetrics;

  // Calculate trend
  const hasTrend = previousAccuracy !== undefined;
  const trend = hasTrend ? accuracy - previousAccuracy : 0;
  const trendPercentage = hasTrend ? (trend * 100).toFixed(1) : null;

  // Metric card configuration
  const metrics = [
    {
      label: 'Total Predictions',
      value: totalPredictions,
      percentage: '100%',
      icon: Info,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      tooltip: 'Total number of students evaluated by the churn prediction model',
    },
    {
      label: 'True Positives',
      value: truePositives,
      percentage: totalPredictions > 0 ? `${((truePositives / totalPredictions) * 100).toFixed(1)}%` : '0%',
      icon: CheckCircle2,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      tooltip: 'Students correctly predicted to churn who actually churned',
    },
    {
      label: 'False Positives',
      value: falsePositives,
      percentage: totalPredictions > 0 ? `${((falsePositives / totalPredictions) * 100).toFixed(1)}%` : '0%',
      icon: AlertTriangle,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      tooltip: 'Students predicted to churn who did NOT churn (false alarm)',
    },
    {
      label: 'False Negatives',
      value: falseNegatives,
      percentage: totalPredictions > 0 ? `${((falseNegatives / totalPredictions) * 100).toFixed(1)}%` : '0%',
      icon: XCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      tooltip: 'Students NOT predicted to churn who actually churned (most critical)',
    },
  ];

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-2xl">Model Performance Summary</CardTitle>
        <CardDescription>
          Current churn prediction accuracy and key metrics
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Primary accuracy metric */}
        <div className="flex items-center justify-between p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Current Accuracy</p>
            <p className="text-5xl font-bold text-blue-900">
              {(accuracy * 100).toFixed(1)}%
            </p>

            {/* Advanced metrics */}
            <div className="flex gap-4 mt-3 text-sm text-muted-foreground">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger className="flex items-center gap-1 cursor-help">
                    Precision: {(precision * 100).toFixed(1)}%
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs text-sm">
                      Of all students predicted to churn, what percentage actually churned?
                      Higher is better.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger className="flex items-center gap-1 cursor-help">
                    Recall: {(recall * 100).toFixed(1)}%
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs text-sm">
                      Of all students who actually churned, what percentage did we predict?
                      Higher is better.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger className="flex items-center gap-1 cursor-help">
                    F1: {(f1Score * 100).toFixed(1)}%
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs text-sm">
                      Harmonic mean of precision and recall. Balanced measure of model performance.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>

          {/* Trend indicator */}
          {hasTrend && (
            <div className="flex flex-col items-end">
              <Badge
                variant={trend >= 0 ? 'default' : 'destructive'}
                className="gap-1"
              >
                {trend >= 0 ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                {trendPercentage}%
              </Badge>
              <span className="text-xs text-muted-foreground mt-1">vs previous</span>
            </div>
          )}
        </div>

        {/* Metrics grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {metrics.map((metric) => {
            const Icon = metric.icon;
            return (
              <TooltipProvider key={metric.label}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className={`p-4 rounded-lg border cursor-help ${metric.bgColor}`}>
                      <div className="flex items-start justify-between mb-2">
                        <span className="text-xs font-medium text-muted-foreground">
                          {metric.label}
                        </span>
                        <Icon className={`h-4 w-4 ${metric.color}`} />
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className={`text-2xl font-bold ${metric.color}`}>
                          {metric.value}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {metric.percentage}
                        </span>
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs text-sm">{metric.tooltip}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            );
          })}
        </div>

        {/* Additional context */}
        {totalPredictions === 0 && (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              No predictions have been made yet. Accuracy metrics will appear once students
              with known outcomes (churned or active &gt; 90 days) are evaluated.
            </p>
          </div>
        )}

        {falseNegatives > 0 && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800 font-medium mb-1">
              Critical: {falseNegatives} missed churn predictions
            </p>
            <p className="text-sm text-red-700">
              These are students who churned but we didn't predict it. Consider adjusting
              weights to improve detection of at-risk students.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
