import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle2, XCircle, BookOpen, Calendar } from "lucide-react"
import Link from "next/link"

interface SessionOutcomesSectionProps {
  homeworkAssigned: boolean
  followUpBooked: boolean
  followUpSessionId?: string | null
}

export default function SessionOutcomesSection({
  homeworkAssigned,
  followUpBooked,
  followUpSessionId,
}: SessionOutcomesSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Session Outcomes</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2">
          {/* Homework Assignment */}
          <div className="flex items-start gap-3 rounded-lg border p-4">
            {homeworkAssigned ? (
              <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-green-600 dark:text-green-500 mt-0.5" />
            ) : (
              <XCircle className="h-5 w-5 flex-shrink-0 text-gray-400 dark:text-gray-600 mt-0.5" />
            )}
            <div>
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-muted-foreground" />
                <p className="font-medium text-sm">
                  {homeworkAssigned ? "Homework assigned" : "No homework assigned"}
                </p>
              </div>
            </div>
          </div>

          {/* Follow-up Booking */}
          <div className="flex items-start gap-3 rounded-lg border p-4">
            {followUpBooked ? (
              <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-green-600 dark:text-green-500 mt-0.5" />
            ) : (
              <XCircle className="h-5 w-5 flex-shrink-0 text-gray-400 dark:text-gray-600 mt-0.5" />
            )}
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <p className="font-medium text-sm">
                  {followUpBooked ? "Follow-up session booked" : "No follow-up booked yet"}
                </p>
              </div>
              {followUpBooked && followUpSessionId && (
                <Link
                  href={`/sessions/${followUpSessionId}`}
                  className="mt-2 inline-flex items-center text-sm text-primary hover:underline"
                >
                  View next session →
                </Link>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
