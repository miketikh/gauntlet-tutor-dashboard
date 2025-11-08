'use client';

import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';

interface LinkedSlider {
  id: string;
  label: string;
  value: number;
  color: string;
}

interface LinkedSlidersProps {
  sliders: LinkedSlider[];
  onChange: (values: Record<string, number>) => void;
  totalSum?: number;
}

export function LinkedSliders({ sliders, onChange, totalSum = 1.0 }: LinkedSlidersProps) {
  const [localValues, setLocalValues] = useState<Record<string, number>>(
    sliders.reduce((acc, slider) => ({ ...acc, [slider.id]: slider.value }), {})
  );

  const handleSliderChange = (id: string, newValue: number) => {
    const currentSum = Object.values(localValues).reduce((sum, val) => sum + val, 0);
    const otherIds = sliders.filter(s => s.id !== id).map(s => s.id);

    // Calculate how much we need to distribute/remove from others
    const difference = newValue - localValues[id];

    // If we're increasing this slider, decrease others proportionally
    if (difference > 0) {
      const otherSum = currentSum - localValues[id];
      const newOtherSum = Math.max(0, totalSum - newValue);

      const updatedValues: Record<string, number> = { ...localValues, [id]: newValue };

      if (otherSum > 0) {
        // Distribute the reduction proportionally
        otherIds.forEach(otherId => {
          const proportion = localValues[otherId] / otherSum;
          updatedValues[otherId] = Math.max(0, newOtherSum * proportion);
        });
      } else {
        // If all others are 0, can't reduce further
        updatedValues[id] = Math.min(newValue, totalSum);
      }

      setLocalValues(updatedValues);
      onChange(updatedValues);
    } else {
      // If we're decreasing this slider, increase others proportionally
      const otherSum = currentSum - localValues[id];
      const newOtherSum = totalSum - newValue;

      const updatedValues: Record<string, number> = { ...localValues, [id]: newValue };

      if (otherSum > 0) {
        // Distribute the increase proportionally
        otherIds.forEach(otherId => {
          const proportion = localValues[otherId] / otherSum;
          updatedValues[otherId] = Math.min(1, newOtherSum * proportion);
        });
      } else {
        // If all others are 0, distribute equally
        const equalShare = newOtherSum / otherIds.length;
        otherIds.forEach(otherId => {
          updatedValues[otherId] = equalShare;
        });
      }

      setLocalValues(updatedValues);
      onChange(updatedValues);
    }
  };

  const handleInputChange = (id: string, value: string) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return;

    const clampedValue = Math.max(0, Math.min(totalSum, numValue));
    handleSliderChange(id, clampedValue);
  };

  const currentSum = Object.values(localValues).reduce((sum, val) => sum + val, 0);
  const isValid = Math.abs(currentSum - totalSum) < 0.01; // Allow small rounding errors

  return (
    <div className="space-y-4">
      {sliders.map((slider) => (
        <div key={slider.id} className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor={slider.id} className="text-sm">
              {slider.label}
            </Label>
            <Input
              id={`${slider.id}-input`}
              type="number"
              step="0.01"
              min="0"
              max={totalSum}
              value={localValues[slider.id]?.toFixed(2) || '0.00'}
              onChange={(e) => handleInputChange(slider.id, e.target.value)}
              className="w-20 h-8 text-right"
            />
          </div>
          <Slider
            id={slider.id}
            value={[localValues[slider.id] * 100]}
            onValueChange={([value]) => handleSliderChange(slider.id, value / 100)}
            max={totalSum * 100}
            step={1}
            className="w-full"
          />
        </div>
      ))}

      <div className={`text-sm font-medium ${isValid ? 'text-green-600' : 'text-destructive'}`}>
        Total: {currentSum.toFixed(2)} / {totalSum.toFixed(2)}
        {!isValid && <span className="ml-2">(Must sum to {totalSum.toFixed(2)})</span>}
      </div>
    </div>
  );
}
