"use client"

import * as React from "react"
import { Calendar as CalendarIcon } from "lucide-react"
import { subDays, startOfDay, endOfDay } from "date-fns"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export interface DateRange {
  from: Date
  to: Date
}

export type DateRangePreset = "7d" | "30d" | "90d" | "all"

export interface DateRangePickerProps {
  value: DateRange
  onChange: (range: DateRange) => void
  presets?: DateRangePreset[]
  className?: string
}

const presetLabels: Record<DateRangePreset, string> = {
  "7d": "Last 7 Days",
  "30d": "Last 30 Days",
  "90d": "Last 90 Days",
  all: "All Time",
}

function getPresetRange(preset: DateRangePreset): DateRange | null {
  const now = new Date()
  const today = endOfDay(now)

  switch (preset) {
    case "7d":
      return { from: startOfDay(subDays(now, 7)), to: today }
    case "30d":
      return { from: startOfDay(subDays(now, 30)), to: today }
    case "90d":
      return { from: startOfDay(subDays(now, 90)), to: today }
    case "all":
      return null // Represents no date restriction
    default:
      return { from: startOfDay(subDays(now, 30)), to: today }
  }
}

export function DateRangePicker({
  value,
  onChange,
  presets = ["7d", "30d", "90d", "all"],
  className,
}: DateRangePickerProps) {
  const [fromInput, setFromInput] = React.useState(
    value.from ? formatDateForInput(value.from) : ""
  )
  const [toInput, setToInput] = React.useState(
    value.to ? formatDateForInput(value.to) : ""
  )

  React.useEffect(() => {
    setFromInput(value.from ? formatDateForInput(value.from) : "")
    setToInput(value.to ? formatDateForInput(value.to) : "")
  }, [value])

  const handlePresetClick = (preset: DateRangePreset) => {
    const range = getPresetRange(preset)
    if (range) {
      onChange(range)
    } else {
      // "All Time" - use a very wide range
      onChange({
        from: startOfDay(new Date(2020, 0, 1)),
        to: endOfDay(new Date()),
      })
    }
  }

  const handleFromChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value
    setFromInput(inputValue)

    if (inputValue) {
      const date = new Date(inputValue)
      if (!isNaN(date.getTime())) {
        onChange({ from: startOfDay(date), to: value.to })
      }
    }
  }

  const handleToChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value
    setToInput(inputValue)

    if (inputValue) {
      const date = new Date(inputValue)
      if (!isNaN(date.getTime())) {
        onChange({ from: value.from, to: endOfDay(date) })
      }
    }
  }

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {/* Preset Buttons */}
      {presets.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {presets.map((preset) => (
            <Button
              key={preset}
              variant="outline"
              size="sm"
              onClick={() => handlePresetClick(preset)}
            >
              {presetLabels[preset]}
            </Button>
          ))}
        </div>
      )}

      {/* Custom Date Inputs */}
      <div className="flex items-end gap-4">
        <div className="flex flex-col gap-2 flex-1">
          <Label htmlFor="date-from">From</Label>
          <div className="relative">
            <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              id="date-from"
              type="date"
              value={fromInput}
              onChange={handleFromChange}
              className="pl-10"
            />
          </div>
        </div>

        <div className="flex flex-col gap-2 flex-1">
          <Label htmlFor="date-to">To</Label>
          <div className="relative">
            <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              id="date-to"
              type="date"
              value={toInput}
              onChange={handleToChange}
              className="pl-10"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

function formatDateForInput(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}
