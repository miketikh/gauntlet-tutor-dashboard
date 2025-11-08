import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getSessionById } from "@/services/session-service"
import { SessionStatus } from "@/lib/db/types"
import SessionHeader from "@/components/sessions/session-header"
import DataAvailabilityBadges from "@/components/sessions/data-availability-badges"
import MetricsSection from "@/components/sessions/metrics-section"
import AIAnalysisSection from "@/components/sessions/ai-analysis-section"
import TranscriptHighlightsSection from "@/components/sessions/transcript-highlights-section"
import StudentFeedbackSection from "@/components/sessions/student-feedback-section"
import SessionOutcomesSection from "@/components/sessions/session-outcomes-section"
import SessionNotFound from "@/components/sessions/session-not-found"
import SessionIncomplete from "@/components/sessions/session-incomplete"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface SessionDetailPageProps {
  params: Promise<{
    sessionId: string
  }>
}

export default async function SessionDetailPage({ params }: SessionDetailPageProps) {
  const supabase = await createClient()

  // Auth check
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect("/auth/sign-in")
  }

  // Await params in Next.js 15
  const { sessionId } = await params

  // Fetch session data
  const sessionData = await getSessionById(sessionId)

  // Handle not found case
  if (!sessionData) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border">
          <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold text-foreground">TutorReview Dashboard</span>
            </div>
          </div>
        </header>
        <main className="container mx-auto px-4 py-8 md:px-6">
          <SessionNotFound sessionId={sessionId} />
        </main>
      </div>
    )
  }

  // Handle incomplete session
  if (sessionData.session.status !== SessionStatus.COMPLETED) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border">
          <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold text-foreground">TutorReview Dashboard</span>
            </div>
          </div>
        </header>
        <main className="container mx-auto px-4 py-8 md:px-6">
          <SessionIncomplete session={sessionData.session} subject={sessionData.subject} />
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold text-foreground">TutorReview Dashboard</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 md:px-6">
        {/* Breadcrumb Navigation */}
        <nav className="mb-6 text-sm text-muted-foreground">
          <ol className="flex items-center gap-2">
            <li>
              <a href="/dashboard" className="hover:text-foreground">Dashboard</a>
            </li>
            <li>/</li>
            <li>
              <a href="/sessions" className="hover:text-foreground">Sessions</a>
            </li>
            <li>/</li>
            <li className="text-foreground">{sessionId.slice(0, 8)}...</li>
          </ol>
        </nav>

        {/* Session Header */}
        <SessionHeader sessionData={sessionData} />

        {/* Data Availability Badges */}
        <div className="mt-6">
          <DataAvailabilityBadges
            hasAudioAnalysis={sessionData.session.has_audio_analysis}
            hasVideoAnalysis={sessionData.session.has_video_analysis}
            hasScreenMonitoring={sessionData.session.has_screen_monitoring}
          />
        </div>

        {/* Metrics Section */}
        <div className="mt-6">
          <MetricsSection sessionData={sessionData} />
        </div>

        {/* AI Analysis Section */}
        <div className="mt-6">
          <AIAnalysisSection aiSummary={sessionData.session.ai_summary} />
        </div>

        {/* Transcript Highlights Section */}
        <div className="mt-6">
          <TranscriptHighlightsSection transcriptHighlights={sessionData.transcriptHighlights} />
        </div>

        {/* Student Feedback Section */}
        <div className="mt-6">
          <StudentFeedbackSection feedback={sessionData.feedback} />
        </div>

        {/* Session Outcomes Section */}
        <div className="mt-6">
          <SessionOutcomesSection
            homeworkAssigned={sessionData.session.homework_assigned}
            followUpBooked={sessionData.session.follow_up_booked}
            followUpSessionId={null}
          />
        </div>
      </main>
    </div>
  )
}
