"use client";

import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, ExternalLink } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { LearningEvent } from '@/services/churn-service';

interface LearningEventCardProps {
  event: LearningEvent;
  onViewDetails?: (event: LearningEvent) => void;
}

export function LearningEventCard({ event, onViewDetails }: LearningEventCardProps) {
  const {
    student_name,
    churn_date,
    predicted_risk,
    predicted_level,
    actual_outcome,
    was_prediction_correct,
    survey_response,
    what_system_learned,
    weight_change_summary,
    created_at,
  } = event;

  // Format date
  const timeAgo = formatDistanceToNow(new Date(created_at), { addSuffix: true });

  // Truncate survey response
  const truncatedSurvey = survey_response && survey_response.length > 100
    ? `${survey_response.substring(0, 100)}...`
    : survey_response;

  // Risk level colors
  const riskColors = {
    low: 'bg-green-100 text-green-800 border-green-200',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    high: 'bg-red-100 text-red-800 border-red-200',
  };

  const riskColor = riskColors[predicted_level] || riskColors.medium;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h4 className="font-medium text-sm">
                {student_name}
              </h4>
              <Badge
                variant={was_prediction_correct ? 'default' : 'destructive'}
                className="text-xs"
              >
                {was_prediction_correct ? (
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                ) : (
                  <XCircle className="h-3 w-3 mr-1" />
                )}
                {was_prediction_correct ? 'Correct' : 'Incorrect'}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">{timeAgo}</p>
          </div>
        </div>

        {/* Prediction vs Actual */}
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Predicted:</span>
            <Badge variant="outline" className={`${riskColor} text-xs`}>
              {predicted_level} risk ({(predicted_risk * 100).toFixed(1)}%)
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Actual:</span>
            <Badge variant="outline" className="text-xs">
              {actual_outcome === 'churned' ? '❌ Churned' : '✅ Active'}
            </Badge>
          </div>
        </div>

        {/* What the system learned */}
        <div className="border-l-2 border-blue-500 pl-3 py-1">
          <p className="text-xs font-medium text-blue-900 mb-1">
            What the System Learned:
          </p>
          <p className="text-xs text-muted-foreground">
            {what_system_learned}
          </p>
        </div>

        {/* Weight changes */}
        {weight_change_summary && (
          <div className="text-xs text-muted-foreground">
            <span className="font-medium">Adjustments: </span>
            {weight_change_summary}
          </div>
        )}

        {/* Survey response (if available) */}
        {truncatedSurvey && (
          <div className="bg-gray-50 p-2 rounded text-xs">
            <p className="font-medium text-gray-700 mb-1">Survey Response:</p>
            <p className="text-gray-600 italic">"{truncatedSurvey}"</p>
          </div>
        )}

        {/* View details button */}
        {onViewDetails && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-xs"
            onClick={() => onViewDetails(event)}
          >
            View Full Case Study
            <ExternalLink className="h-3 w-3 ml-1.5" />
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
