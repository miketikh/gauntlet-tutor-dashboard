"use client";

import { useState } from 'react';
import { WeightSlider } from './weight-slider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CheckCircle2, RotateCcw } from 'lucide-react';
import type { ChurnFactorCategoryType } from '@/lib/db/types';

interface WeightPanelProps {
  weights: Record<string, number>;
  onWeightsChange: (weights: Record<string, number>) => void;
  suggestedWeights?: Record<string, number>;
  disabled?: boolean;
  onSave?: () => void;
  onApplySuggested?: () => void;
  onReset?: () => void;
}

// Default weights
const DEFAULT_WEIGHTS: Record<string, number> = {
  first_session_satisfaction: 0.25,
  sessions_completed: 0.15,
  follow_up_booking_rate: 0.20,
  avg_session_score: 0.15,
  tutor_consistency: 0.10,
  student_engagement: 0.15,
};

// Ordered list of factors to display
const FACTOR_ORDER: ChurnFactorCategoryType[] = [
  'first_session_satisfaction',
  'sessions_completed',
  'follow_up_booking_rate',
  'avg_session_score',
  'tutor_consistency',
  'student_engagement',
];

export function WeightPanel({
  weights,
  onWeightsChange,
  suggestedWeights,
  disabled = false,
  onSave,
  onApplySuggested,
  onReset,
}: WeightPanelProps) {
  const [localWeights, setLocalWeights] = useState(weights);

  // Calculate sum and validation
  const sum = Object.values(localWeights).reduce((acc, w) => acc + w, 0);
  const isValid = Math.abs(sum - 1.0) < 0.001; // Tolerance for floating point
  const sumPercentage = (sum * 100).toFixed(1);

  // Calculate deltas from original weights
  const deltas = Object.entries(localWeights)
    .map(([factor, weight]) => {
      const originalWeight = weights[factor] || 0;
      const diff = weight - originalWeight;
      return { factor, diff };
    })
    .filter(({ diff }) => Math.abs(diff) > 0.001)
    .sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff)); // Sort by magnitude

  const hasChanges = deltas.length > 0;

  const handleWeightChange = (factor: string, newWeight: number) => {
    const newWeights = {
      ...localWeights,
      [factor]: newWeight,
    };
    setLocalWeights(newWeights);
    onWeightsChange(newWeights);
  };

  const handleApplySuggested = () => {
    if (suggestedWeights) {
      setLocalWeights(suggestedWeights);
      onWeightsChange(suggestedWeights);
      onApplySuggested?.();
    }
  };

  const handleReset = () => {
    setLocalWeights(DEFAULT_WEIGHTS);
    onWeightsChange(DEFAULT_WEIGHTS);
    onReset?.();
  };

  const handleResetToCurrent = () => {
    setLocalWeights(weights);
    onWeightsChange(weights);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Churn Prediction Factors & Weights</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Weight sliders */}
        <div className="space-y-4">
          {FACTOR_ORDER.map((factor) => (
            <WeightSlider
              key={factor}
              factor={factor}
              weight={localWeights[factor] || 0}
              suggestedWeight={suggestedWeights?.[factor]}
              onChange={(value) => handleWeightChange(factor, value)}
              disabled={disabled}
            />
          ))}
        </div>

        {/* Validation and sum display */}
        <div className="border-t pt-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Total Weight Sum:</span>
            <div className="flex items-center gap-2">
              <span className={`text-lg font-bold ${isValid ? 'text-green-600' : 'text-red-600'}`}>
                {sumPercentage}%
              </span>
              {isValid ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600" />
              )}
            </div>
          </div>

          {!isValid && (
            <p className="text-sm text-red-600 mt-2 flex items-center gap-1">
              <AlertCircle className="h-4 w-4" />
              Weights must sum to exactly 100%. Adjust sliders to balance.
            </p>
          )}

          {isValid && hasChanges && (
            <div className="mt-3 p-3 bg-blue-50 rounded-md">
              <p className="text-sm font-medium text-blue-900 mb-2">Changes from current:</p>
              <ul className="text-xs text-blue-800 space-y-1">
                {deltas.slice(0, 3).map(({ factor, diff }) => {
                  const sign = diff > 0 ? '+' : '';
                  const percentage = (diff * 100).toFixed(1);
                  const factorName = factor.replace(/_/g, ' ');
                  return (
                    <li key={factor} className="flex items-center gap-1">
                      <span className={diff > 0 ? 'text-green-700' : 'text-red-700'}>
                        {sign}{percentage}%
                      </span>
                      <span className="capitalize">{factorName}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-2 border-t pt-4">
          {suggestedWeights && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleApplySuggested}
              disabled={disabled}
            >
              Apply Suggested
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            disabled={disabled}
          >
            <RotateCcw className="h-4 w-4 mr-1.5" />
            Reset to Defaults
          </Button>

          {hasChanges && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetToCurrent}
              disabled={disabled}
            >
              Discard Changes
            </Button>
          )}

          {onSave && (
            <Button
              size="sm"
              onClick={onSave}
              disabled={!isValid || disabled || !hasChanges}
              className="ml-auto"
            >
              Save Changes
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
