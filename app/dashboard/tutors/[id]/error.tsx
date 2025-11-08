"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { AlertTriangle } from "lucide-react"
import Link from "next/link"

export default function TutorDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to console for debugging
    console.error("Tutor detail page error:", error)
  }, [error])

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4 md:px-6">
          <h1 className="text-2xl font-bold">Error Loading Tutor</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 md:px-6">
        <Card className="border-l-4 border-l-destructive">
          <CardContent className="p-8">
            <div className="flex flex-col items-center text-center">
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
                <AlertTriangle className="h-8 w-8 text-destructive" />
              </div>

              <h2 className="mb-2 text-xl font-semibold text-foreground">
                Something went wrong
              </h2>

              <p className="mb-6 max-w-md text-sm text-muted-foreground">
                We encountered an error while loading this tutor's details. This could be due to a
                network issue or the tutor may not exist.
              </p>

              {error.message && (
                <div className="mb-6 rounded-md bg-muted p-4 max-w-md">
                  <p className="text-xs font-mono text-muted-foreground">
                    {error.message}
                  </p>
                </div>
              )}

              <div className="flex gap-3">
                <Button onClick={reset} variant="default">
                  Try Again
                </Button>
                <Link href="/dashboard/tutors">
                  <Button variant="outline">
                    Back to Tutors
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
