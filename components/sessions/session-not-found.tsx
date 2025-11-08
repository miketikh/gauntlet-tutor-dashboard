import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertCircle } from "lucide-react"
import Link from "next/link"

interface SessionNotFoundProps {
  sessionId: string
}

export default function SessionNotFound({ sessionId }: SessionNotFoundProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-destructive">
          <AlertCircle className="h-6 w-6" />
          Session Not Found
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-muted-foreground">
          The session you're looking for could not be found.
        </p>

        <div className="rounded-lg bg-muted p-4">
          <p className="text-sm font-medium mb-1">Session ID:</p>
          <p className="font-mono text-sm text-muted-foreground">{sessionId}</p>
        </div>

        <div>
          <p className="text-sm font-medium mb-2">Possible reasons:</p>
          <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
            <li>The session ID is invalid or incorrect</li>
            <li>The session may have been deleted</li>
            <li>You may not have access to this session</li>
          </ul>
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
