import { format } from "date-fns"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { ScoreBadge } from "@/components/ui/score-badge"
import { BookOpen } from "lucide-react"
import type { SessionWithMetrics } from "@/services/session-service"

interface SessionHeaderProps {
  sessionData: SessionWithMetrics
}

export default function SessionHeader({ sessionData }: SessionHeaderProps) {
  const { session, subject } = sessionData

  // Format date/time
  const formattedDate = format(new Date(session.scheduled_start), "MMM dd, yyyy 'at' h:mm a")

  // Format duration
  const formatDuration = (minutes: number) => {
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60)
      const mins = minutes % 60
      return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`
    }
    return `${minutes} min`
  }

  const scheduledDuration = formatDuration(session.scheduled_duration)
  const actualDuration = session.actual_duration
    ? formatDuration(session.actual_duration)
    : null

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          {/* Left side: Session details */}
          <div className="flex-1 space-y-4">
            {/* Date and time */}
            <div>
              <p className="text-sm text-muted-foreground">Session Date</p>
              <p className="text-lg font-semibold">{formattedDate}</p>
            </div>

            {/* Duration */}
            <div>
              <p className="text-sm text-muted-foreground">Duration</p>
              <p className="text-base">
                {scheduledDuration} session
                {actualDuration && actualDuration !== scheduledDuration && (
                  <span className="text-muted-foreground"> (actual: {actualDuration})</span>
                )}
              </p>
            </div>

            {/* Tutor and Student */}
            <div className="flex flex-col gap-3 sm:flex-row sm:gap-6">
              <div>
                <p className="text-sm text-muted-foreground">Tutor</p>
                <Link
                  href={`/dashboard/tutors/${session.tutor_id}`}
                  className="text-base font-medium text-primary hover:underline"
                >
                  Tutor #{session.tutor_id.slice(0, 8)}
                </Link>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Student</p>
                <p className="text-base font-medium">
                  Student #{session.student_id.slice(0, 8)}
                </p>
              </div>
            </div>

            {/* Subject and Session Number */}
            <div className="flex flex-col gap-3 sm:flex-row sm:gap-6">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-muted-foreground" />
                <span className="text-base font-medium">{subject.name}</span>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">
                  Session #{session.session_number} with this student
                </p>
              </div>
            </div>
          </div>

          {/* Right side: Overall score */}
          <div className="flex flex-col items-start md:items-center">
            <p className="mb-2 text-sm text-muted-foreground">Overall Score</p>
            <ScoreBadge
              score={session.overall_session_score ? parseFloat(session.overall_session_score) : 0}
              size="lg"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
