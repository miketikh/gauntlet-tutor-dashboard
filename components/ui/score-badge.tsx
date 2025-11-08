import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

const scoreBadgeVariants = cva("font-semibold tabular-nums", {
  variants: {
    size: {
      sm: "text-xs px-2 py-0.5",
      md: "text-sm px-3 py-1",
      lg: "text-base px-4 py-1.5",
    },
  },
  defaultVariants: {
    size: "md",
  },
})

function getScoreVariant(score: number): "destructive" | "default" | "secondary" {
  if (score < 4) return "destructive"
  if (score < 7) return "default" // Will be styled as warning/yellow
  if (score < 8.5) return "secondary"
  return "default" // Will be styled as success/green
}

function getScoreColor(score: number): string {
  if (score < 4) return "" // Uses destructive variant
  if (score < 7) return "bg-yellow-500 text-white hover:bg-yellow-600 dark:bg-yellow-600 dark:hover:bg-yellow-700"
  if (score < 8.5) return "" // Uses secondary variant
  return "bg-green-600 text-white hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800"
}

export interface ScoreBadgeProps extends VariantProps<typeof scoreBadgeVariants> {
  score: number
  showLabel?: boolean
  className?: string
}

export function ScoreBadge({
  score,
  size = "md",
  showLabel = false,
  className,
}: ScoreBadgeProps) {
  const formattedScore = score.toFixed(1)
  const variant = getScoreVariant(score)
  const customColor = getScoreColor(score)

  return (
    <Badge
      variant={variant}
      className={cn(
        scoreBadgeVariants({ size }),
        customColor,
        className
      )}
    >
      {showLabel ? `Score: ${formattedScore}` : formattedScore}
    </Badge>
  )
}
