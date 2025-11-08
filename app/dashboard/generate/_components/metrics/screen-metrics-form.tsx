'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';

export interface ScreenMetricsData {
  enabled: boolean;
  activeTabFocusPct: number;
  tabSwitchesCount: number;
  whiteboardUsageMinutes: number;
  messagingAppDetected: boolean;
  gamingDetected: boolean;
}

interface ScreenMetricsFormProps {
  data: ScreenMetricsData;
  onChange: (data: ScreenMetricsData) => void;
  maxDuration: number; // Session duration in minutes
}

export function ScreenMetricsForm({ data, onChange, maxDuration }: ScreenMetricsFormProps) {
  const handleToggle = (checked: boolean) => {
    onChange({ ...data, enabled: checked });
  };

  const handlePercentageChange = (field: keyof ScreenMetricsData, value: number) => {
    onChange({ ...data, [field]: value });
  };

  const handleCountChange = (field: keyof ScreenMetricsData, value: string) => {
    const numValue = parseInt(value);
    if (!isNaN(numValue) && numValue >= 0) {
      onChange({ ...data, [field]: numValue });
    }
  };

  const handleCheckboxChange = (field: keyof ScreenMetricsData, checked: boolean) => {
    onChange({ ...data, [field]: checked });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Screen Metrics</CardTitle>
            <CardDescription>Optional screen monitoring metrics</CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="screen-enabled"
              checked={data.enabled}
              onCheckedChange={handleToggle}
            />
            <Label htmlFor="screen-enabled" className="cursor-pointer">
              Enable Screen Monitoring
            </Label>
          </div>
        </div>
      </CardHeader>

      {data.enabled && (
        <CardContent className="space-y-6">
          {/* Active Tab Focus */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Active Tab Focus</Label>
              <span className="text-sm font-medium">{(data.activeTabFocusPct * 100).toFixed(0)}%</span>
            </div>
            <Slider
              value={[data.activeTabFocusPct * 100]}
              onValueChange={([value]) => handlePercentageChange('activeTabFocusPct', value / 100)}
              max={100}
              step={1}
            />
            <p className="text-xs text-muted-foreground">
              Percentage of time the tutoring tab was in focus
            </p>
          </div>

          {/* Tab Switches and Whiteboard Usage */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="tabSwitches">Tab Switches</Label>
              <Input
                id="tabSwitches"
                type="number"
                min="0"
                max="50"
                value={data.tabSwitchesCount}
                onChange={(e) => handleCountChange('tabSwitchesCount', e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Number of times student switched tabs
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="whiteboardUsage">Whiteboard Usage (minutes)</Label>
              <Input
                id="whiteboardUsage"
                type="number"
                min="0"
                max={maxDuration}
                value={data.whiteboardUsageMinutes}
                onChange={(e) => handleCountChange('whiteboardUsageMinutes', e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Max: {maxDuration} minutes (session duration)
              </p>
            </div>
          </div>

          {/* App Detection */}
          <div className="space-y-4">
            <Label className="text-sm font-semibold">App Detection</Label>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="messagingApp"
                  checked={data.messagingAppDetected}
                  onCheckedChange={(checked) => handleCheckboxChange('messagingAppDetected', checked as boolean)}
                />
                <Label htmlFor="messagingApp" className="cursor-pointer">
                  Messaging App Detected
                </Label>
              </div>
              <p className="text-xs text-muted-foreground ml-6">
                Slack, Discord, WhatsApp, iMessage, etc.
              </p>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="gamingDetected"
                  checked={data.gamingDetected}
                  onCheckedChange={(checked) => handleCheckboxChange('gamingDetected', checked as boolean)}
                />
                <Label htmlFor="gamingDetected" className="cursor-pointer">
                  Gaming Detected
                </Label>
              </div>
              <p className="text-xs text-muted-foreground ml-6">
                Games or gaming platforms detected during session
              </p>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
