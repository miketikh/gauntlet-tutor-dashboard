import * as React from "react"
import { type LucideIcon } from "lucide-react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendIndicator } from "@/components/ui/trend-indicator"

const metricCardVariants = cva("", {
  variants: {
    variant: {
      default: "",
      success: "border-green-200 dark:border-green-900",
      warning: "border-yellow-200 dark:border-yellow-900",
      danger: "border-red-200 dark:border-red-900",
    },
  },
  defaultVariants: {
    variant: "default",
  },
})

const metricIconVariants = cva("size-5", {
  variants: {
    variant: {
      default: "text-muted-foreground",
      success: "text-green-600 dark:text-green-400",
      warning: "text-yellow-600 dark:text-yellow-400",
      danger: "text-red-600 dark:text-red-400",
    },
  },
  defaultVariants: {
    variant: "default",
  },
})

export interface MetricCardProps extends VariantProps<typeof metricCardVariants> {
  title: string
  value: string | number
  icon?: LucideIcon
  trend?: "up" | "down" | "neutral"
  trendValue?: string | number
  description?: string
  className?: string
  children?: React.ReactNode
}

export function MetricCard({
  title,
  value,
  icon: Icon,
  trend,
  trendValue,
  description,
  variant = "default",
  className,
  children,
}: MetricCardProps) {
  return (
    <Card className={cn(metricCardVariants({ variant }), className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {title}
          </CardTitle>
          {Icon && (
            <Icon className={metricIconVariants({ variant })} />
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="text-3xl font-bold">
          {value}
        </div>
        {(trend || description) && (
          <div className="flex items-center gap-2">
            {trend && (
              <TrendIndicator
                direction={trend}
                value={trendValue}
                size="sm"
              />
            )}
            {description && (
              <CardDescription className="text-xs">
                {description}
              </CardDescription>
            )}
          </div>
        )}
        {children}
      </CardContent>
    </Card>
  )
}
