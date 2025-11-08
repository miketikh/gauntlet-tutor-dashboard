"use client"

import { PerformanceChart, type PerformanceChartData } from "@/components/ui/performance-chart"
import { TrendIndicator } from "@/components/ui/trend-indicator"
import { EmptyState } from "@/components/ui/empty-state"
import { BarChart3 } from "lucide-react"

interface PerformanceTrendsSectionProps {
  trends: PerformanceChartData[]
}

export function PerformanceTrendsSection({ trends }: PerformanceTrendsSectionProps) {
  // Handle empty state
  if (trends.length === 0) {
    return (
      <EmptyState
        icon={BarChart3}
        title="Not enough data yet"
        description="Complete more sessions to see performance trends over time"
      />
    )
  }

  // Calculate trend indicators (compare last 7 days vs previous 7 days)
  const calculateTrend = (metricKey: "sessionScore" | "engagement" | "satisfaction") => {
    if (trends.length < 14) {
      return { direction: "neutral" as const, value: null }
    }

    const last7Days = trends.slice(-7)
    const previous7Days = trends.slice(-14, -7)

    const last7Avg =
      last7Days.reduce((sum, t) => sum + (t[metricKey] || 0), 0) /
      last7Days.filter(t => t[metricKey] != null).length

    const previous7Avg =
      previous7Days.reduce((sum, t) => sum + (t[metricKey] || 0), 0) /
      previous7Days.filter(t => t[metricKey] != null).length

    if (isNaN(last7Avg) || isNaN(previous7Avg)) {
      return { direction: "neutral" as const, value: null }
    }

    const change = last7Avg - previous7Avg

    // Direction based on threshold of ±0.3
    const direction: "up" | "down" | "neutral" = Math.abs(change) < 0.3 ? "neutral" : change > 0 ? "up" : "down"
    const value = change > 0 ? `+${change.toFixed(1)}` : change.toFixed(1)

    return { direction, value }
  }

  const sessionScoreTrend = calculateTrend("sessionScore")
  const engagementTrend = calculateTrend("engagement")
  const satisfactionTrend = calculateTrend("satisfaction")

  return (
    <div className="space-y-4">
      {/* Trend Indicators */}
      <div className="flex flex-wrap gap-6">
        <div className="flex flex-col gap-1">
          <span className="text-sm text-muted-foreground">Session Score</span>
          <TrendIndicator
            direction={sessionScoreTrend.direction}
            value={sessionScoreTrend.value ?? undefined}
            size="md"
          />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-sm text-muted-foreground">Engagement</span>
          <TrendIndicator
            direction={engagementTrend.direction}
            value={engagementTrend.value ?? undefined}
            size="md"
          />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-sm text-muted-foreground">Satisfaction</span>
          <TrendIndicator
            direction={satisfactionTrend.direction}
            value={satisfactionTrend.value ?? undefined}
            size="md"
          />
        </div>
      </div>

      {/* Performance Chart */}
      <PerformanceChart
        data={trends}
        metrics={["sessionScore", "engagement", "satisfaction"]}
        height={300}
      />

      {/* Note for new tutors */}
      {trends.length < 30 && (
        <p className="text-xs text-muted-foreground">
          Note: Showing {trends.length} days of data. Full 30-day view will be available after more sessions.
        </p>
      )}
    </div>
  )
}
