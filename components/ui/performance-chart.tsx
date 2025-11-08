"use client"

import * as React from "react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { cn } from "@/lib/utils"

export interface PerformanceChartData {
  date: string
  sessionScore?: number
  engagement?: number
  satisfaction?: number
}

export interface PerformanceChartProps {
  data: PerformanceChartData[]
  metrics?: Array<"sessionScore" | "engagement" | "satisfaction">
  height?: number
  title?: string
  className?: string
}

const metricConfig = {
  sessionScore: {
    label: "Session Score",
    color: "hsl(var(--primary))",
    dataKey: "sessionScore",
  },
  engagement: {
    label: "Engagement",
    color: "hsl(var(--accent-foreground))",
    dataKey: "engagement",
  },
  satisfaction: {
    label: "Satisfaction",
    color: "hsl(142.1 76.2% 36.3%)", // success color
    dataKey: "satisfaction",
  },
}

export function PerformanceChart({
  data,
  metrics = ["sessionScore", "engagement", "satisfaction"],
  height = 300,
  title,
  className,
}: PerformanceChartProps) {
  return (
    <div className={cn("w-full", className)}>
      {title && (
        <h3 className="text-lg font-semibold mb-4">{title}</h3>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <LineChart
          data={data}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis
            dataKey="date"
            className="text-xs"
            stroke="hsl(var(--muted-foreground))"
          />
          <YAxis
            domain={[0, 10]}
            className="text-xs"
            stroke="hsl(var(--muted-foreground))"
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "var(--radius)",
            }}
            labelStyle={{ color: "hsl(var(--foreground))" }}
          />
          <Legend
            wrapperStyle={{
              paddingTop: "20px",
            }}
          />
          {metrics.map((metric) => {
            const config = metricConfig[metric]
            return (
              <Line
                key={metric}
                type="monotone"
                dataKey={config.dataKey}
                name={config.label}
                stroke={config.color}
                strokeWidth={2}
                dot={{ fill: config.color, r: 4 }}
                activeDot={{ r: 6 }}
                connectNulls
              />
            )
          })}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
