import * as React from "react"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const trendIndicatorVariants = cva("inline-flex items-center gap-1 font-medium", {
  variants: {
    direction: {
      up: "text-green-600 dark:text-green-400",
      down: "text-red-600 dark:text-red-400",
      neutral: "text-muted-foreground",
    },
    size: {
      sm: "text-xs [&>svg]:size-3",
      md: "text-sm [&>svg]:size-4",
    },
  },
  defaultVariants: {
    direction: "neutral",
    size: "md",
  },
})

export interface TrendIndicatorProps extends VariantProps<typeof trendIndicatorVariants> {
  direction: "up" | "down" | "neutral"
  value?: string | number
  className?: string
}

export function TrendIndicator({
  direction,
  value,
  size = "md",
  className,
}: TrendIndicatorProps) {
  const Icon = direction === "up" ? TrendingUp : direction === "down" ? TrendingDown : Minus

  return (
    <span className={cn(trendIndicatorVariants({ direction, size }), className)}>
      <Icon />
      {value !== undefined && <span>{value}</span>}
    </span>
  )
}
