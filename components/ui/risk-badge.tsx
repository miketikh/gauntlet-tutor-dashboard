import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { CheckCircle, AlertTriangle, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

const riskBadgeVariants = cva("font-medium inline-flex items-center gap-1.5", {
  variants: {
    size: {
      sm: "text-xs px-2 py-0.5 [&>svg]:h-3 [&>svg]:w-3",
      md: "text-sm px-3 py-1 [&>svg]:h-4 [&>svg]:w-4",
      lg: "text-base px-4 py-1.5 [&>svg]:h-5 [&>svg]:w-5",
    },
  },
  defaultVariants: {
    size: "md",
  },
})

const riskConfig = {
  low: {
    label: "Low Risk",
    icon: CheckCircle,
    color: "bg-green-600 text-white hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800 border-transparent",
  },
  medium: {
    label: "Medium Risk",
    icon: AlertTriangle,
    color: "bg-yellow-500 text-white hover:bg-yellow-600 dark:bg-yellow-600 dark:hover:bg-yellow-700 border-transparent",
  },
  high: {
    label: "High Risk",
    icon: AlertCircle,
    color: "border-transparent", // Will use destructive variant
  },
}

export interface RiskBadgeProps extends VariantProps<typeof riskBadgeVariants> {
  level: "low" | "medium" | "high"
  type?: "tutor" | "student"
  showLabel?: boolean
  customLabel?: string
  className?: string
}

export function RiskBadge({
  level,
  type,
  showLabel = true,
  customLabel,
  size = "md",
  className,
}: RiskBadgeProps) {
  const config = riskConfig[level]
  const Icon = config.icon

  const label = customLabel || config.label
  const displayText = showLabel ? label : null

  // Use destructive variant for high risk, otherwise use custom colors
  const variant = level === "high" ? "destructive" : undefined

  return (
    <Badge
      variant={variant}
      className={cn(
        riskBadgeVariants({ size }),
        level !== "high" && config.color,
        className
      )}
    >
      <Icon className="flex-shrink-0" />
      {displayText && <span>{displayText}</span>}
    </Badge>
  )
}
