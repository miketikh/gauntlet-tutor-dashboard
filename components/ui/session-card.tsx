import * as React from "react"
import { formatDistanceToNow } from "date-fns"
import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { ScoreBadge } from "@/components/ui/score-badge"
import { Badge } from "@/components/ui/badge"

export interface SessionCardData {
  id: string
  timestamp: Date
  subject: string
  tutorName: string
  overallScore?: number
  engagementScore?: number
  highlights?: string[]
  flags?: string[]
}

export interface SessionCardProps {
  session: SessionCardData
  onClick?: (sessionId: string) => void
  className?: string
}

export function SessionCard({ session, onClick, className }: SessionCardProps) {
  const handleClick = () => {
    if (onClick) {
      onClick(session.id)
    }
  }

  return (
    <Card
      className={cn(
        "transition-all hover:shadow-md",
        onClick && "cursor-pointer hover:border-primary/50",
        className
      )}
      onClick={handleClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-3 mb-2">
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-sm mb-1 truncate">
                  {session.subject}
                </h4>
                <p className="text-xs text-muted-foreground mb-1">
                  with {session.tutorName}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(session.timestamp, { addSuffix: true })}
                </p>
              </div>
            </div>

            {session.highlights && session.highlights.length > 0 && (
              <div className="text-xs text-muted-foreground mt-2 space-y-1">
                {session.highlights.slice(0, 2).map((highlight, index) => (
                  <p key={index} className="truncate">• {highlight}</p>
                ))}
              </div>
            )}

            {session.flags && session.flags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {session.flags.map((flag, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {flag}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col items-end gap-2 flex-shrink-0">
            {session.overallScore !== undefined && (
              <div className="flex flex-col items-end gap-1">
                <span className="text-xs text-muted-foreground">Overall</span>
                <ScoreBadge score={session.overallScore} size="md" />
              </div>
            )}
            {session.engagementScore !== undefined && (
              <div className="flex flex-col items-end gap-1">
                <span className="text-xs text-muted-foreground">Engagement</span>
                <ScoreBadge score={session.engagementScore} size="sm" />
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
