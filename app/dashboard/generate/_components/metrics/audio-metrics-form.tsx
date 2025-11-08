'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { LinkedSliders } from './linked-sliders';

export interface AudioMetricsData {
  tutorTalkRatio: number;
  studentTalkRatio: number;
  productiveSilenceRatio: number;
  awkwardPauseRatio: number;
  studentEngagementScore: number;
  tutorEnthusiasmScore: number;
  studentInitiatedQuestions: number;
  tutorChecksUnderstandingCount: number;
  tutorPositiveReinforcementCount: number;
  avgStudentResponseDelay: number;
  longPausesCount: number;
  studentFrustrationCount: number;
  studentConfusionCount: number;
  positiveMomentsCount: number;
  conceptReExplanationCount: number;
  openEndedQuestions: number;
  closedEndedQuestions: number;
  rhetoricalQuestions: number;
}

interface AudioMetricsFormProps {
  data: AudioMetricsData;
  onChange: (data: AudioMetricsData) => void;
}

export function AudioMetricsForm({ data, onChange }: AudioMetricsFormProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleTalkRatiosChange = (values: Record<string, number>) => {
    onChange({
      ...data,
      tutorTalkRatio: values.tutor,
      studentTalkRatio: values.student,
      productiveSilenceRatio: values.productiveSilence,
      awkwardPauseRatio: values.awkwardPause,
    });
  };

  const handleScoreChange = (field: keyof AudioMetricsData, value: number) => {
    onChange({ ...data, [field]: value });
  };

  const handleCountChange = (field: keyof AudioMetricsData, value: string) => {
    const numValue = parseInt(value);
    if (!isNaN(numValue) && numValue >= 0) {
      onChange({ ...data, [field]: numValue });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Audio Metrics</CardTitle>
        <CardDescription>
          Configure audio analysis metrics (always present for completed sessions)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Talk Ratios */}
        <div className="space-y-2">
          <Label className="text-base font-semibold">Talk Time Distribution</Label>
          <p className="text-xs text-muted-foreground mb-4">
            Adjust how speaking time is distributed (must sum to 1.0)
          </p>
          <LinkedSliders
            sliders={[
              { id: 'tutor', label: 'Tutor Talk Ratio', value: data.tutorTalkRatio, color: 'blue' },
              { id: 'student', label: 'Student Talk Ratio', value: data.studentTalkRatio, color: 'green' },
              { id: 'productiveSilence', label: 'Productive Silence', value: data.productiveSilenceRatio, color: 'yellow' },
              { id: 'awkwardPause', label: 'Awkward Pauses', value: data.awkwardPauseRatio, color: 'red' },
            ]}
            onChange={handleTalkRatiosChange}
          />
        </div>

        {/* Engagement Scores */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Student Engagement Score</Label>
              <span className="text-sm font-medium">{data.studentEngagementScore.toFixed(1)}</span>
            </div>
            <Slider
              value={[data.studentEngagementScore * 10]}
              onValueChange={([value]) => handleScoreChange('studentEngagementScore', value / 10)}
              max={100}
              step={1}
            />
            <p className="text-xs text-muted-foreground">0 (disengaged) to 10 (highly engaged)</p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Tutor Enthusiasm Score</Label>
              <span className="text-sm font-medium">{data.tutorEnthusiasmScore.toFixed(1)}</span>
            </div>
            <Slider
              value={[data.tutorEnthusiasmScore * 10]}
              onValueChange={([value]) => handleScoreChange('tutorEnthusiasmScore', value / 10)}
              max={100}
              step={1}
            />
            <p className="text-xs text-muted-foreground">0 (low energy) to 10 (very enthusiastic)</p>
          </div>
        </div>

        {/* Interaction Counts */}
        <div className="space-y-2">
          <Label className="text-base font-semibold">Interaction Counts</Label>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="studentQuestions">Student Questions</Label>
              <Input
                id="studentQuestions"
                type="number"
                min="0"
                max="20"
                value={data.studentInitiatedQuestions}
                onChange={(e) => handleCountChange('studentInitiatedQuestions', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="understandingChecks">Understanding Checks</Label>
              <Input
                id="understandingChecks"
                type="number"
                min="0"
                max="15"
                value={data.tutorChecksUnderstandingCount}
                onChange={(e) => handleCountChange('tutorChecksUnderstandingCount', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="positiveReinforcement">Positive Reinforcement</Label>
              <Input
                id="positiveReinforcement"
                type="number"
                min="0"
                max="20"
                value={data.tutorPositiveReinforcementCount}
                onChange={(e) => handleCountChange('tutorPositiveReinforcementCount', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Advanced Section */}
        <div className="space-y-4">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full"
          >
            {showAdvanced ? <ChevronUp className="h-4 w-4 mr-2" /> : <ChevronDown className="h-4 w-4 mr-2" />}
            {showAdvanced ? 'Hide' : 'Show'} Advanced Metrics
          </Button>

          {showAdvanced && (
            <div className="space-y-4 pt-4 border-t">
              {/* Response Delay */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Avg Student Response Delay (seconds)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    min="0.5"
                    max="10"
                    value={data.avgStudentResponseDelay.toFixed(1)}
                    onChange={(e) => handleScoreChange('avgStudentResponseDelay', parseFloat(e.target.value))}
                    className="w-20"
                  />
                </div>
                <Slider
                  value={[data.avgStudentResponseDelay * 10]}
                  onValueChange={([value]) => handleScoreChange('avgStudentResponseDelay', value / 10)}
                  min={5}
                  max={100}
                  step={1}
                />
              </div>

              {/* Negative Indicators */}
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="longPauses">Long Pauses</Label>
                  <Input
                    id="longPauses"
                    type="number"
                    min="0"
                    max="10"
                    value={data.longPausesCount}
                    onChange={(e) => handleCountChange('longPausesCount', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="frustration">Frustration Count</Label>
                  <Input
                    id="frustration"
                    type="number"
                    min="0"
                    max="10"
                    value={data.studentFrustrationCount}
                    onChange={(e) => handleCountChange('studentFrustrationCount', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confusion">Confusion Count</Label>
                  <Input
                    id="confusion"
                    type="number"
                    min="0"
                    max="10"
                    value={data.studentConfusionCount}
                    onChange={(e) => handleCountChange('studentConfusionCount', e.target.value)}
                  />
                </div>
              </div>

              {/* Positive Indicators */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="positiveMoments">Positive Moments</Label>
                  <Input
                    id="positiveMoments"
                    type="number"
                    min="0"
                    max="15"
                    value={data.positiveMomentsCount}
                    onChange={(e) => handleCountChange('positiveMomentsCount', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reExplanations">Re-explanations</Label>
                  <Input
                    id="reExplanations"
                    type="number"
                    min="0"
                    max="5"
                    value={data.conceptReExplanationCount}
                    onChange={(e) => handleCountChange('conceptReExplanationCount', e.target.value)}
                  />
                </div>
              </div>

              {/* Question Types */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Question Type Distribution</Label>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="openEnded">Open-ended</Label>
                    <Input
                      id="openEnded"
                      type="number"
                      min="0"
                      max="30"
                      value={data.openEndedQuestions}
                      onChange={(e) => handleCountChange('openEndedQuestions', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="closedEnded">Closed-ended</Label>
                    <Input
                      id="closedEnded"
                      type="number"
                      min="0"
                      max="30"
                      value={data.closedEndedQuestions}
                      onChange={(e) => handleCountChange('closedEndedQuestions', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="rhetorical">Rhetorical</Label>
                    <Input
                      id="rhetorical"
                      type="number"
                      min="0"
                      max="10"
                      value={data.rhetoricalQuestions}
                      onChange={(e) => handleCountChange('rhetoricalQuestions', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
