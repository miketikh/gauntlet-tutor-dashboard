"use client"

import * as React from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"

export type FilterType = "select" | "search" | "checkbox" | "dateRange"

export interface SelectFilterConfig {
  type: "select"
  id: string
  label: string
  placeholder?: string
  options: { value: string; label: string }[]
  value?: string
}

export interface SearchFilterConfig {
  type: "search"
  id: string
  label: string
  placeholder?: string
  value?: string
}

export interface CheckboxFilterConfig {
  type: "checkbox"
  id: string
  label: string
  options: { value: string; label: string }[]
  value?: string[]
}

export interface DateRangeFilterConfig {
  type: "dateRange"
  id: string
  label: string
  value?: { from: Date; to: Date }
}

export type FilterConfig =
  | SelectFilterConfig
  | SearchFilterConfig
  | CheckboxFilterConfig
  | DateRangeFilterConfig

export interface FilterBarProps {
  filters: FilterConfig[]
  onFilterChange: (filterId: string, value: any) => void
  onReset: () => void
  className?: string
}

export function FilterBar({
  filters,
  onFilterChange,
  onReset,
  className,
}: FilterBarProps) {
  const hasActiveFilters = React.useMemo(() => {
    return filters.some((filter) => {
      if (filter.type === "select" || filter.type === "search") {
        return filter.value && filter.value !== ""
      }
      if (filter.type === "checkbox") {
        return filter.value && filter.value.length > 0
      }
      if (filter.type === "dateRange") {
        return filter.value && (filter.value.from || filter.value.to)
      }
      return false
    })
  }, [filters])

  return (
    <div className={cn("flex flex-wrap items-end gap-4", className)}>
      {filters.map((filter) => {
        if (filter.type === "select") {
          return (
            <div key={filter.id} className="flex flex-col gap-2">
              <Label htmlFor={filter.id}>{filter.label}</Label>
              <Select
                value={filter.value || ""}
                onValueChange={(value) => onFilterChange(filter.id, value)}
              >
                <SelectTrigger id={filter.id} className="w-[180px]">
                  <SelectValue
                    placeholder={filter.placeholder || "Select..."}
                  />
                </SelectTrigger>
                <SelectContent>
                  {filter.options.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )
        }

        if (filter.type === "search") {
          return (
            <div key={filter.id} className="flex flex-col gap-2">
              <Label htmlFor={filter.id}>{filter.label}</Label>
              <Input
                id={filter.id}
                type="text"
                placeholder={filter.placeholder || "Search..."}
                value={filter.value || ""}
                onChange={(e) => onFilterChange(filter.id, e.target.value)}
                className="w-[200px]"
              />
            </div>
          )
        }

        if (filter.type === "checkbox") {
          return (
            <div key={filter.id} className="flex flex-col gap-2">
              <Label>{filter.label}</Label>
              <div className="flex flex-col gap-2">
                {filter.options.map((option) => {
                  const isChecked = filter.value?.includes(option.value) || false
                  return (
                    <div key={option.value} className="flex items-center gap-2">
                      <Checkbox
                        id={`${filter.id}-${option.value}`}
                        checked={isChecked}
                        onCheckedChange={(checked) => {
                          const currentValues = filter.value || []
                          const newValues = checked
                            ? [...currentValues, option.value]
                            : currentValues.filter((v) => v !== option.value)
                          onFilterChange(filter.id, newValues)
                        }}
                      />
                      <Label
                        htmlFor={`${filter.id}-${option.value}`}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {option.label}
                      </Label>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        }

        // DateRange filter would be handled here
        // For now, returning null as it's typically handled by DateRangePicker component
        return null
      })}

      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onReset}
          className="h-9 px-2 lg:px-3"
        >
          <X className="mr-2 h-4 w-4" />
          Reset Filters
        </Button>
      )}
    </div>
  )
}
