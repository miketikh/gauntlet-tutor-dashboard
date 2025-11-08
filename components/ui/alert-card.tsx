import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Info, AlertTriangle, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

const alertCardVariants = cva(
  "border-l-4",
  {
    variants: {
      severity: {
        info: "border-l-blue-500 bg-blue-50 dark:bg-blue-950/20",
        warning: "border-l-yellow-500 bg-yellow-50 dark:bg-yellow-950/20",
        critical: "border-l-destructive bg-destructive/10",
      },
    },
    defaultVariants: {
      severity: "info",
    },
  }
)

const iconMap = {
  info: Info,
  warning: AlertTriangle,
  critical: AlertCircle,
}

const iconColorMap = {
  info: "text-blue-600 dark:text-blue-400",
  warning: "text-yellow-600 dark:text-yellow-400",
  critical: "text-destructive",
}

export interface AlertCardProps extends VariantProps<typeof alertCardVariants> {
  title: string
  description: string
  timestamp: Date
  onAcknowledge?: () => void
  onResolve?: () => void
  sessionId?: string
  className?: string
}

export function AlertCard({
  title,
  description,
  severity = "info",
  timestamp,
  onAcknowledge,
  onResolve,
  sessionId,
  className,
}: AlertCardProps) {
  const Icon = iconMap[severity as keyof typeof iconMap]
  const iconColor = iconColorMap[severity as keyof typeof iconColorMap]

  // Format timestamp as relative time
  const formatTimestamp = (date: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return "just now"
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    return `${diffDays}d ago`
  }

  return (
    <Card className={cn(alertCardVariants({ severity }), "py-4", className)}>
      <CardContent className="p-0">
        <div className="flex gap-4">
          <div className="flex-shrink-0">
            <Icon className={cn("h-5 w-5", iconColor)} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold mb-1">{title}</h4>
                <p className="text-sm text-muted-foreground mb-2">{description}</p>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>{formatTimestamp(timestamp)}</span>
                  {sessionId && (
                    <>
                      <span>•</span>
                      <Link
                        href={`/dashboard/sessions/${sessionId}`}
                        className="text-primary hover:underline"
                      >
                        View Session
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </div>
            {(onAcknowledge || onResolve) && (
              <div className="flex gap-2 mt-3">
                {onAcknowledge && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onAcknowledge}
                  >
                    Acknowledge
                  </Button>
                )}
                {onResolve && (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={onResolve}
                  >
                    Resolve
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
