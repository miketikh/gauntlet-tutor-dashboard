'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';

export interface VideoMetricsData {
  enabled: boolean;
  studentOnScreenAttentionPct: number;
  studentVisualEngagementScore: number;
  distractionEventsCount: number;
  confusionMomentsCount: number;
  tutorUsesVisualAids: boolean;
  studentTakingNotesDuration: number;
}

interface VideoMetricsFormProps {
  data: VideoMetricsData;
  onChange: (data: VideoMetricsData) => void;
  maxDuration: number; // Session duration in minutes
}

export function VideoMetricsForm({ data, onChange, maxDuration }: VideoMetricsFormProps) {
  const handleToggle = (checked: boolean) => {
    onChange({ ...data, enabled: checked });
  };

  const handlePercentageChange = (field: keyof VideoMetricsData, value: number) => {
    onChange({ ...data, [field]: value });
  };

  const handleScoreChange = (field: keyof VideoMetricsData, value: number) => {
    onChange({ ...data, [field]: value });
  };

  const handleCountChange = (field: keyof VideoMetricsData, value: string) => {
    const numValue = parseInt(value);
    if (!isNaN(numValue) && numValue >= 0) {
      onChange({ ...data, [field]: numValue });
    }
  };

  const handleCheckboxChange = (field: keyof VideoMetricsData, checked: boolean) => {
    onChange({ ...data, [field]: checked });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Video Metrics</CardTitle>
            <CardDescription>Optional video analysis metrics</CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="video-enabled"
              checked={data.enabled}
              onCheckedChange={handleToggle}
            />
            <Label htmlFor="video-enabled" className="cursor-pointer">
              Enable Video Analysis
            </Label>
          </div>
        </div>
      </CardHeader>

      {data.enabled && (
        <CardContent className="space-y-6">
          {/* Attention Percentage */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Student On-Screen Attention</Label>
              <span className="text-sm font-medium">{(data.studentOnScreenAttentionPct * 100).toFixed(0)}%</span>
            </div>
            <Slider
              value={[data.studentOnScreenAttentionPct * 100]}
              onValueChange={([value]) => handlePercentageChange('studentOnScreenAttentionPct', value / 100)}
              max={100}
              step={1}
            />
            <p className="text-xs text-muted-foreground">
              Percentage of time student is looking at screen
            </p>
          </div>

          {/* Visual Engagement Score */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Visual Engagement Score</Label>
              <span className="text-sm font-medium">{data.studentVisualEngagementScore.toFixed(1)}</span>
            </div>
            <Slider
              value={[data.studentVisualEngagementScore * 10]}
              onValueChange={([value]) => handleScoreChange('studentVisualEngagementScore', value / 10)}
              max={100}
              step={1}
            />
            <p className="text-xs text-muted-foreground">
              0 (disengaged) to 10 (highly engaged visually)
            </p>
          </div>

          {/* Event Counts */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="distractionEvents">Distraction Events</Label>
              <Input
                id="distractionEvents"
                type="number"
                min="0"
                max="20"
                value={data.distractionEventsCount}
                onChange={(e) => handleCountChange('distractionEventsCount', e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Times student looked away</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confusionMoments">Confusion Moments</Label>
              <Input
                id="confusionMoments"
                type="number"
                min="0"
                max="15"
                value={data.confusionMomentsCount}
                onChange={(e) => handleCountChange('confusionMomentsCount', e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Detected confused facial expressions</p>
            </div>
          </div>

          {/* Visual Aids and Note-taking */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="visualAids"
                  checked={data.tutorUsesVisualAids}
                  onCheckedChange={(checked) => handleCheckboxChange('tutorUsesVisualAids', checked as boolean)}
                />
                <Label htmlFor="visualAids" className="cursor-pointer">
                  Tutor Uses Visual Aids
                </Label>
              </div>
              <p className="text-xs text-muted-foreground ml-6">
                Charts, diagrams, screen sharing, etc.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="noteDuration">Note-taking Duration (minutes)</Label>
              <Input
                id="noteDuration"
                type="number"
                min="0"
                max={maxDuration}
                value={data.studentTakingNotesDuration}
                onChange={(e) => handleCountChange('studentTakingNotesDuration', e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Max: {maxDuration} minutes (session duration)
              </p>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
