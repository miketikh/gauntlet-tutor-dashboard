import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Info } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"

interface SessionIncompleteProps {
  session: {
    id: string
    status: string
    scheduled_start: Date
    tutor_id: string
    student_id: string
  }
  subject: {
    name: string
  }
}

export default function SessionIncomplete({ session, subject }: SessionIncompleteProps) {
  const formattedDate = format(new Date(session.scheduled_start), "MMM dd, yyyy 'at' h:mm a")

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Info className="h-6 w-6 text-blue-600" />
          Session Not Completed
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <p className="text-sm text-muted-foreground">Current status:</p>
          <Badge variant="secondary">{session.status}</Badge>
        </div>

        <p className="text-sm text-muted-foreground">
          This session has not been completed yet. Detailed metrics and analysis are only available
          after session completion.
        </p>

        <div className="rounded-lg bg-muted p-4 space-y-2">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <span className="font-medium">Scheduled:</span>
            <span className="text-muted-foreground">{formattedDate}</span>

            <span className="font-medium">Subject:</span>
            <span className="text-muted-foreground">{subject.name}</span>

            <span className="font-medium">Tutor ID:</span>
            <span className="font-mono text-xs text-muted-foreground">
              {session.tutor_id.slice(0, 8)}...
            </span>

            <span className="font-medium">Student ID:</span>
            <span className="font-mono text-xs text-muted-foreground">
              {session.student_id.slice(0, 8)}...
            </span>
          </div>
        </div>

        <div className="pt-4">
          <Link href="/dashboard">
            <Button>Return to Dashboard</Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
