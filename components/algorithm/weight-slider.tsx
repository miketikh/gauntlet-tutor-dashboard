"use client";

import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { ChurnFactorCategoryType } from '@/lib/db/types';

interface WeightSliderProps {
  factor: ChurnFactorCategoryType;
  weight: number; // 0-1
  suggestedWeight?: number; // 0-1
  onChange: (value: number) => void;
  disabled?: boolean;
}

// Human-readable factor names and descriptions
const FACTOR_INFO: Record<ChurnFactorCategoryType, { name: string; description: string }> = {
  first_session_satisfaction: {
    name: 'First Session Satisfaction',
    description: 'How well the first session went. Poor first sessions (< 6.5) are heavily weighted as a churn predictor.',
  },
  sessions_completed: {
    name: 'Sessions Completed',
    description: 'Total number of sessions finished. More sessions indicate higher commitment and lower churn risk.',
  },
  follow_up_booking_rate: {
    name: 'Follow-Up Booking Rate',
    description: 'Percentage of sessions that led to rebooking. High rebooking rate indicates student satisfaction.',
  },
  avg_session_score: {
    name: 'Average Session Score',
    description: 'Average quality score across all sessions. Consistently low scores correlate with churn.',
  },
  tutor_consistency: {
    name: 'Tutor Consistency',
    description: 'Whether student works with same tutor or switches frequently. Frequent switches may indicate dissatisfaction.',
  },
  student_engagement: {
    name: 'Student Engagement',
    description: 'Average engagement score from audio analysis. Low engagement often precedes churn.',
  },
  tutor_switch_frequency: {
    name: 'Tutor Switch Frequency',
    description: 'How often the student changes tutors. Frequent switches may indicate fit issues.',
  },
  scheduling_friction: {
    name: 'Scheduling Friction',
    description: 'Difficulty in booking and maintaining regular sessions. High friction leads to disengagement.',
  },
  response_rate: {
    name: 'Response Rate',
    description: 'How often student provides feedback and responds to communications.',
  },
};

// Impact level based on weight value
function getImpactLevel(weight: number): {
  level: string;
  colorClass: string;
} {
  if (weight >= 0.20) {
    return { level: 'Very High', colorClass: 'bg-red-500' };
  } else if (weight >= 0.15) {
    return { level: 'High', colorClass: 'bg-orange-500' };
  } else if (weight >= 0.10) {
    return { level: 'Medium', colorClass: 'bg-yellow-500' };
  } else {
    return { level: 'Low', colorClass: 'bg-blue-500' };
  }
}

export function WeightSlider({
  factor,
  weight,
  suggestedWeight,
  onChange,
  disabled = false,
}: WeightSliderProps) {
  const info = FACTOR_INFO[factor];
  const weightPercentage = Math.round(weight * 100);
  const suggestedPercentage = suggestedWeight ? Math.round(suggestedWeight * 100) : null;
  const impact = getImpactLevel(weight);

  const handleSliderChange = (values: number[]) => {
    const newValue = values[0] / 100; // Convert 0-100 to 0-1
    onChange(newValue);
  };

  return (
    <div className="space-y-2">
      {/* Header with factor name and tooltip */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{info.name}</span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent side="right" className="max-w-xs">
                <p className="text-sm">{info.description}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Impact badge */}
        <Badge variant="outline" className="text-xs">
          <div className={`w-2 h-2 rounded-full mr-1.5 ${impact.colorClass}`} />
          {impact.level}
        </Badge>
      </div>

      {/* Slider with current and suggested values */}
      <div className="space-y-1">
        <Slider
          value={[weightPercentage]}
          onValueChange={handleSliderChange}
          min={0}
          max={100}
          step={1}
          disabled={disabled}
          className="w-full"
        />

        {/* Current and suggested weight display */}
        <div className="flex items-center justify-between text-sm">
          <span className="font-semibold text-primary">
            {weightPercentage}%
          </span>

          {suggestedPercentage !== null && suggestedPercentage !== weightPercentage && (
            <span className="text-muted-foreground">
              Suggested: <span className="font-medium text-blue-600">{suggestedPercentage}%</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
