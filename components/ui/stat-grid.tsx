import * as React from "react"
import { type LucideIcon } from "lucide-react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { MetricCard, type MetricCardProps } from "@/components/ui/metric-card"

const statGridVariants = cva("grid gap-4", {
  variants: {
    columns: {
      2: "grid-cols-1 md:grid-cols-2",
      3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
      4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
    },
    variant: {
      default: "",
      compact: "gap-3",
    },
  },
  defaultVariants: {
    columns: 3,
    variant: "default",
  },
})

export interface StatItem {
  label: string
  value: string | number
  icon?: LucideIcon
  trend?: "up" | "down" | "neutral"
  trendValue?: string | number
  description?: string
  variant?: MetricCardProps["variant"]
}

export interface StatGridProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof statGridVariants> {
  stats: StatItem[]
}

export function StatGrid({
  stats,
  columns = 3,
  variant = "default",
  className,
  ...props
}: StatGridProps) {
  return (
    <div
      className={cn(statGridVariants({ columns, variant }), className)}
      {...props}
    >
      {stats.map((stat, index) => (
        <MetricCard
          key={index}
          title={stat.label}
          value={stat.value}
          icon={stat.icon}
          trend={stat.trend}
          trendValue={stat.trendValue}
          description={stat.description}
          variant={stat.variant}
        />
      ))}
    </div>
  )
}
