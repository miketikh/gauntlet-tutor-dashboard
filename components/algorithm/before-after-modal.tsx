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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ArrowRight, TrendingUp, TrendingDown, AlertTriangle, CheckCircle2 } from 'lucide-react';
import type { AccuracyMetrics } from '@/services/churn-service';

interface ComparisonResult {
  student_id: string;
  student_name: string;
  old_prediction: 'churn' | 'no_churn';
  new_prediction: 'churn' | 'no_churn';
  actual_outcome: 'churned' | 'active';
  old_risk_score: number;
  new_risk_score: number;
  is_improvement: boolean;
}

interface BeforeAfterModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  oldWeights: Record<string, number>;
  newWeights: Record<string, number>;
  beforeMetrics: AccuracyMetrics;
  afterMetrics: AccuracyMetrics;
  affectedStudents?: ComparisonResult[];
}

export function BeforeAfterModal({
  open,
  onClose,
  onConfirm,
  oldWeights,
  newWeights,
  beforeMetrics,
  afterMetrics,
  affectedStudents = [],
}: BeforeAfterModalProps) {
  const [showImprovementsOnly, setShowImprovementsOnly] = useState(false);

  // Calculate weight deltas
  const weightDeltas = Object.keys(newWeights).map((factor) => {
    const oldWeight = oldWeights[factor] || 0;
    const newWeight = newWeights[factor] || 0;
    const delta = newWeight - oldWeight;
    return {
      factor,
      oldWeight,
      newWeight,
      delta,
    };
  }).filter(w => Math.abs(w.delta) > 0.001)
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));

  // Calculate metric improvements
  const accuracyDelta = afterMetrics.accuracy - beforeMetrics.accuracy;
  const precisionDelta = afterMetrics.precision - beforeMetrics.precision;
  const recallDelta = afterMetrics.recall - beforeMetrics.recall;
  const f1Delta = afterMetrics.f1Score - beforeMetrics.f1Score;
  const falseNegativesReduction = beforeMetrics.falseNegatives - afterMetrics.falseNegatives;

  // Filter affected students
  const displayedStudents = showImprovementsOnly
    ? affectedStudents.filter(s => s.is_improvement)
    : affectedStudents;

  const improvementCount = affectedStudents.filter(s => s.is_improvement).length;

  // Overall assessment
  const isSignificantImprovement = accuracyDelta > 0.05 || falseNegativesReduction > 0;
  const recommendation = isSignificantImprovement
    ? 'Apply - These changes would significantly improve model performance'
    : accuracyDelta > 0
    ? 'Apply - Minor improvement expected'
    : 'Needs More Analysis - Changes may not improve performance';

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Before/After Weight Comparison</DialogTitle>
          <DialogDescription>
            Review the projected impact of weight changes on historical predictions
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Section 1: Weight Changes Summary */}
          <div>
            <h3 className="font-semibold text-lg mb-3">Weight Changes Summary</h3>
            <div className="grid grid-cols-2 gap-4">
              {weightDeltas.slice(0, 6).map(({ factor, oldWeight, newWeight, delta }) => {
                const isIncrease = delta > 0;
                const percentage = (delta * 100).toFixed(1);
                const sign = isIncrease ? '+' : '';

                return (
                  <div key={factor} className="border rounded-lg p-3">
                    <p className="text-sm font-medium capitalize mb-2">
                      {factor.replace(/_/g, ' ')}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold">
                          {(oldWeight * 100).toFixed(1)}%
                        </span>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        <span className="text-lg font-bold">
                          {(newWeight * 100).toFixed(1)}%
                        </span>
                      </div>
                      <Badge
                        variant={isIncrease ? 'default' : 'secondary'}
                        className={isIncrease ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}
                      >
                        {sign}{percentage}%
                      </Badge>
                    </div>
                    {/* Visual bar */}
                    <div className="mt-2 flex gap-1 h-2">
                      <div
                        className="bg-blue-300 rounded"
                        style={{ width: `${oldWeight * 100}%` }}
                      />
                      <div
                        className="bg-blue-600 rounded"
                        style={{ width: `${newWeight * 100}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 2: Accuracy Metrics Comparison */}
          <div>
            <h3 className="font-semibold text-lg mb-3">Accuracy Metrics Comparison</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Metric</TableHead>
                  <TableHead className="text-right">Before</TableHead>
                  <TableHead className="text-right">After</TableHead>
                  <TableHead className="text-right">Change</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">Overall Accuracy</TableCell>
                  <TableCell className="text-right">{(beforeMetrics.accuracy * 100).toFixed(1)}%</TableCell>
                  <TableCell className="text-right">{(afterMetrics.accuracy * 100).toFixed(1)}%</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {accuracyDelta > 0 ? (
                        <TrendingUp className="h-4 w-4 text-green-600" />
                      ) : accuracyDelta < 0 ? (
                        <TrendingDown className="h-4 w-4 text-red-600" />
                      ) : null}
                      <span className={accuracyDelta > 0 ? 'text-green-600 font-medium' : accuracyDelta < 0 ? 'text-red-600 font-medium' : ''}>
                        {accuracyDelta > 0 ? '+' : ''}{(accuracyDelta * 100).toFixed(2)}%
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Precision</TableCell>
                  <TableCell className="text-right">{(beforeMetrics.precision * 100).toFixed(1)}%</TableCell>
                  <TableCell className="text-right">{(afterMetrics.precision * 100).toFixed(1)}%</TableCell>
                  <TableCell className="text-right">
                    <span className={precisionDelta > 0 ? 'text-green-600' : precisionDelta < 0 ? 'text-red-600' : ''}>
                      {precisionDelta > 0 ? '+' : ''}{(precisionDelta * 100).toFixed(2)}%
                    </span>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Recall</TableCell>
                  <TableCell className="text-right">{(beforeMetrics.recall * 100).toFixed(1)}%</TableCell>
                  <TableCell className="text-right">{(afterMetrics.recall * 100).toFixed(1)}%</TableCell>
                  <TableCell className="text-right">
                    <span className={recallDelta > 0 ? 'text-green-600' : recallDelta < 0 ? 'text-red-600' : ''}>
                      {recallDelta > 0 ? '+' : ''}{(recallDelta * 100).toFixed(2)}%
                    </span>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">F1 Score</TableCell>
                  <TableCell className="text-right">{(beforeMetrics.f1Score * 100).toFixed(1)}%</TableCell>
                  <TableCell className="text-right">{(afterMetrics.f1Score * 100).toFixed(1)}%</TableCell>
                  <TableCell className="text-right">
                    <span className={f1Delta > 0 ? 'text-green-600' : f1Delta < 0 ? 'text-red-600' : ''}>
                      {f1Delta > 0 ? '+' : ''}{(f1Delta * 100).toFixed(2)}%
                    </span>
                  </TableCell>
                </TableRow>
                <TableRow className="bg-red-50">
                  <TableCell className="font-medium">False Negatives (Critical)</TableCell>
                  <TableCell className="text-right">{beforeMetrics.falseNegatives}</TableCell>
                  <TableCell className="text-right">{afterMetrics.falseNegatives}</TableCell>
                  <TableCell className="text-right">
                    <span className={falseNegativesReduction > 0 ? 'text-green-600 font-medium' : falseNegativesReduction < 0 ? 'text-red-600 font-medium' : ''}>
                      {falseNegativesReduction > 0 ? '-' : falseNegativesReduction < 0 ? '+' : ''}{Math.abs(falseNegativesReduction)}
                    </span>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">False Positives</TableCell>
                  <TableCell className="text-right">{beforeMetrics.falsePositives}</TableCell>
                  <TableCell className="text-right">{afterMetrics.falsePositives}</TableCell>
                  <TableCell className="text-right">
                    {afterMetrics.falsePositives - beforeMetrics.falsePositives > 0 ? '+' : ''}
                    {afterMetrics.falsePositives - beforeMetrics.falsePositives}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          {/* Section 3: Specific Students Affected */}
          {displayedStudents.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-lg">Specific Students Affected</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowImprovementsOnly(!showImprovementsOnly)}
                >
                  {showImprovementsOnly ? 'Show All' : 'Show Improvements Only'}
                </Button>
              </div>
              <div className="text-sm text-muted-foreground mb-2">
                Showing {displayedStudents.length} of {affectedStudents.length} students
                {improvementCount > 0 && ` (${improvementCount} improvements)`}
              </div>
              <div className="max-h-64 overflow-y-auto border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Old Prediction</TableHead>
                      <TableHead>New Prediction</TableHead>
                      <TableHead>Actual</TableHead>
                      <TableHead>Improvement?</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {displayedStudents.slice(0, 10).map((student) => (
                      <TableRow key={student.student_id}>
                        <TableCell className="font-medium">{student.student_name}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {student.old_prediction === 'churn' ? 'Churn' : 'No Churn'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {student.new_prediction === 'churn' ? 'Churn' : 'No Churn'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={student.actual_outcome === 'churned' ? 'destructive' : 'default'} className="text-xs">
                            {student.actual_outcome === 'churned' ? 'Churned' : 'Active'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {student.is_improvement ? (
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                          ) : (
                            <span className="text-muted-foreground text-xs">No change</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {/* Section 4: Summary & Recommendation */}
          <div>
            <h3 className="font-semibold text-lg mb-3">Summary</h3>
            <div className={`p-4 rounded-lg border ${
              isSignificantImprovement
                ? 'bg-green-50 border-green-200'
                : accuracyDelta > 0
                ? 'bg-blue-50 border-blue-200'
                : 'bg-yellow-50 border-yellow-200'
            }`}>
              <div className="flex items-start gap-3">
                {isSignificantImprovement ? (
                  <CheckCircle2 className="h-6 w-6 text-green-600 mt-0.5" />
                ) : accuracyDelta > 0 ? (
                  <TrendingUp className="h-6 w-6 text-blue-600 mt-0.5" />
                ) : (
                  <AlertTriangle className="h-6 w-6 text-yellow-600 mt-0.5" />
                )}
                <div>
                  <p className="font-medium">
                    {recommendation}
                  </p>
                  <p className="text-sm mt-2">
                    {improvementCount > 0 && (
                      <>
                        These changes would improve predictions for <strong>{improvementCount}</strong> students.
                        {' '}
                      </>
                    )}
                    {falseNegativesReduction > 0 && (
                      <>
                        Would catch <strong>{falseNegativesReduction}</strong> additional churn cases.
                      </>
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            {onConfirm && (
              <Button onClick={onConfirm} disabled={accuracyDelta < 0}>
                Confirm & Apply
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
