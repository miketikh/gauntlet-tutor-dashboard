"use client";

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { WeightPanel } from './weight-panel';
import { Separator } from '@/components/ui/separator';
import { AlertTriangle, CheckCircle2, TrendingUp, XCircle } from 'lucide-react';
import type { CaseStudyRecommendation } from '@/services/churn-service';

interface CaseStudyModalProps {
  open: boolean;
  onClose: () => void;
  caseStudy: CaseStudyRecommendation | null;
  onApply?: (weights: Record<string, number>) => void;
  projectedAccuracyDelta?: number; // How much accuracy would improve
}

export function CaseStudyModal({
  open,
  onClose,
  caseStudy,
  onApply,
  projectedAccuracyDelta,
}: CaseStudyModalProps) {
  const [editMode, setEditMode] = useState(false);
  const [modifiedWeights, setModifiedWeights] = useState<Record<string, number> | null>(null);

  if (!caseStudy) return null;

  const {
    predicted_risk,
    actual_outcome,
    was_correct,
    suggested_weights,
    rationale,
    factor_analysis,
  } = caseStudy;

  const currentWeights = modifiedWeights || suggested_weights;

  // Risk level styling
  const riskColors = {
    low: 'bg-green-100 text-green-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-red-100 text-red-800',
  };

  const handleApply = () => {
    if (onApply) {
      onApply(currentWeights);
    }
    onClose();
  };

  const handleModify = () => {
    setEditMode(true);
    if (!modifiedWeights) {
      setModifiedWeights(suggested_weights);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Churn Case Study Analysis</DialogTitle>
          <DialogDescription>
            Review the prediction accuracy and recommended weight adjustments
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Section 1: What Happened */}
          <div>
            <h3 className="font-semibold text-lg mb-3">What Happened</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="border rounded-lg p-4">
                <p className="text-sm text-muted-foreground mb-2">System Prediction</p>
                <Badge className={`${riskColors[predicted_risk.level]} text-sm`}>
                  {predicted_risk.level.toUpperCase()} RISK
                </Badge>
                <p className="text-2xl font-bold mt-2">
                  {(predicted_risk.score * 100).toFixed(1)}%
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Churn probability score
                </p>
              </div>

              <div className="border rounded-lg p-4">
                <p className="text-sm text-muted-foreground mb-2">Actual Outcome</p>
                <Badge variant={actual_outcome === 'churned' ? 'destructive' : 'default'} className="text-sm">
                  {actual_outcome === 'churned' ? 'CHURNED' : 'ACTIVE'}
                </Badge>
                <div className="mt-3">
                  {was_correct ? (
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle2 className="h-5 w-5" />
                      <span className="font-medium">Prediction Correct</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-red-600">
                      <XCircle className="h-5 w-5" />
                      <span className="font-medium">Prediction Incorrect</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {!was_correct && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-red-900">Prediction Error Detected</p>
                    <p className="text-sm text-red-700 mt-1">
                      The system's prediction did not match the actual outcome. This presents a
                      learning opportunity to improve the algorithm.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Section 2: System's Prediction Breakdown */}
          <div>
            <h3 className="font-semibold text-lg mb-3">System's Prediction Breakdown</h3>
            <div className="space-y-2">
              {predicted_risk.factors.map((factor) => {
                const percentage = (factor.contribution_to_risk * 100).toFixed(1);
                const barWidth = `${percentage}%`;
                const isProblematic = !was_correct &&
                  ((actual_outcome === 'churned' && factor.impact === 'positive') ||
                   (actual_outcome === 'active' && factor.impact === 'negative'));

                return (
                  <div key={factor.category} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="capitalize">
                        {factor.category.replace(/_/g, ' ')}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">
                          Value: {factor.value.toFixed(2)}
                        </span>
                        <span className="font-medium">{percentage}% contribution</span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          isProblematic ? 'bg-red-500' : 'bg-blue-500'
                        }`}
                        style={{ width: barWidth }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <Separator />

          {/* Section 3: Recommended Weight Adjustments */}
          <div>
            <h3 className="font-semibold text-lg mb-3">
              {was_correct ? 'Current Weights (No Changes Needed)' : 'Recommended Weight Adjustments'}
            </h3>

            {!editMode ? (
              <>
                <div className="prose prose-sm mb-4">
                  <p className="text-muted-foreground whitespace-pre-line">{rationale}</p>
                </div>

                {factor_analysis.length > 0 && (
                  <div className="space-y-2 mb-4">
                    <p className="text-sm font-medium">Specific Adjustments:</p>
                    {factor_analysis.map((fa) => (
                      <div key={fa.factor} className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium capitalize">
                            {fa.factor.replace(/_/g, ' ')}
                          </span>
                          <span className="text-sm">
                            {(fa.current_weight * 100).toFixed(1)}% → {(fa.suggested_weight * 100).toFixed(1)}%
                          </span>
                        </div>
                        <p className="text-xs text-blue-800">{fa.reason}</p>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <WeightPanel
                weights={currentWeights}
                onWeightsChange={setModifiedWeights}
              />
            )}
          </div>

          {/* Section 4: Before/After Impact Projection */}
          {projectedAccuracyDelta !== undefined && projectedAccuracyDelta !== 0 && (
            <>
              <Separator />
              <div>
                <h3 className="font-semibold text-lg mb-3">Impact Projection</h3>
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <TrendingUp className="h-6 w-6 text-green-600" />
                    <div>
                      <p className="font-medium text-green-900">
                        Projected Accuracy Improvement
                      </p>
                      <p className="text-sm text-green-700">
                        Applying these weights would improve accuracy by{' '}
                        <span className="font-bold">
                          {(projectedAccuracyDelta * 100).toFixed(2)}%
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Action buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Dismiss Case
            </Button>

            {!editMode && !was_correct && factor_analysis.length > 0 && (
              <Button variant="outline" onClick={handleModify}>
                Modify Weights
              </Button>
            )}

            {!was_correct && factor_analysis.length > 0 && (
              <Button onClick={handleApply}>
                Apply Changes
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
