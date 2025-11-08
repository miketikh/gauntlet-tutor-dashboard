import { redirect } from "next/navigation"
import { getTutorDetailById, getTutorPerformanceTrends, getTutorInsightsData, getTutorAlertsData, getCoachingNotes } from "@/services/tutor-service"
import { getSessionsByTutorId } from "@/services/session-service"
import { PageHeader } from "@/components/ui/page-header"
import { StatGrid } from "@/components/ui/stat-grid"
import { ScoreBadge } from "@/components/ui/score-badge"
import { RiskBadge } from "@/components/ui/risk-badge"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { SectionContainer } from "@/components/ui/section-container"
import { PerformanceTrendsSection } from "@/components/tutors/performance-trends-section"
import { SessionHistoryTable } from "@/components/tutors/session-history-table"
import { AlertCard } from "@/components/ui/alert-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { User, Mail, Calendar, AlertTriangle, Star, Users, TrendingUp, BarChart3, CheckCircle, Lightbulb, FileText, MessageSquare } from "lucide-react"
import { format, formatDistanceToNow } from "date-fns"

interface PageProps {
  params: Promise<{
    id: string
  }>
}

// Generate dynamic metadata
export async function generateMetadata({ params }: PageProps) {
  try {
    const { id } = await params
    const tutorDetail = await getTutorDetailById(id)

    if (!tutorDetail) {
      return {
        title: "Tutor Not Found | TutorReview",
        description: "The requested tutor could not be found.",
      }
    }

    const title = `${tutorDetail.name} - Performance Analysis | TutorReview`
    const description = tutorDetail.bio
      ? tutorDetail.bio.slice(0, 155) + (tutorDetail.bio.length > 155 ? "..." : "")
      : `View detailed performance analysis and session history for ${tutorDetail.name}.`

    return {
      title,
      description,
    }
  } catch (error) {
    return {
      title: "Tutor Detail | TutorReview",
      description: "View tutor performance analysis and session history.",
    }
  }
}

export default async function TutorDetailPage({ params }: PageProps) {
  // Await params in Next.js 15
  const { id } = await params

  // Fetch tutor detail data, performance trends, insights, alerts, session history, and coaching notes
  const [tutorDetail, performanceTrends, insightsData, alertsData, sessionHistory, coachingNotesData] = await Promise.all([
    getTutorDetailById(id),
    getTutorPerformanceTrends(id, 30),
    getTutorInsightsData(id),
    getTutorAlertsData(id, false),
    getSessionsByTutorId(id),
    getCoachingNotes(id),
  ])

  if (!tutorDetail) {
    redirect("/dashboard/tutors")
  }

  // Calculate rating divergence warning
  const showDivergenceWarning =
    tutorDetail.rating_score_divergence !== null &&
    tutorDetail.rating_score_divergence > 2.0

  // Format member since date
  const memberSinceFormatted = format(new Date(tutorDetail.member_since), "MMM yyyy")

  // Format subjects list
  const subjectsList = tutorDetail.subjects.map(s => s.name).join(", ")

  return (
    <>
      <PageHeader
        title={tutorDetail.preferred_name || tutorDetail.name}
        description={subjectsList}
        actions={
          <Button variant="outline" size="sm" className="gap-2">
            <Mail className="h-4 w-4" />
            Contact
          </Button>
        }
      />
        {/* Tutor Header Section */}
        <div className="mb-8 flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          {/* Left: Profile Info */}
          <div className="flex gap-4">
            {/* Avatar */}
            <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-muted">
              <User className="h-8 w-8 text-muted-foreground" />
            </div>

            {/* Profile Details */}
            <div className="flex-1 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-2xl font-bold text-foreground">
                  {tutorDetail.name}
                </h2>
                {tutorDetail.overall_score !== null && (
                  <ScoreBadge score={tutorDetail.overall_score} size="lg" />
                )}
              </div>

              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                {tutorDetail.email && (
                  <div className="flex items-center gap-1">
                    <Mail className="h-4 w-4" />
                    <span>{tutorDetail.email}</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>Member since {memberSinceFormatted}</span>
                </div>
              </div>

              {/* Warning Badges */}
              {showDivergenceWarning && (
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="outline" className="gap-1 border-yellow-500 text-yellow-700 dark:text-yellow-400">
                    <AlertTriangle className="h-3 w-3" />
                    Rating/Score Mismatch
                  </Badge>
                </div>
              )}
            </div>
          </div>

          {/* Right: Churn Risk Badge */}
          <div className="flex items-center gap-2">
            <RiskBadge level={tutorDetail.tutor_churn_risk} type="tutor" size="lg" />
          </div>
        </div>

        <Separator className="my-6" />

        {/* Quick Stats Grid */}
        <div className="mb-8">
          <h3 className="mb-4 text-lg font-semibold text-foreground">Quick Stats</h3>
          <StatGrid
            columns={4}
            stats={[
              {
                label: "Total Sessions",
                value: tutorDetail.total_sessions,
                icon: BarChart3,
                description: "Completed sessions",
              },
              {
                label: "Avg Student Rating",
                value: tutorDetail.avg_student_rating !== null
                  ? `${tutorDetail.avg_student_rating.toFixed(1)}/5`
                  : "N/A",
                icon: Star,
                description: tutorDetail.avg_student_rating !== null
                  ? `${("★".repeat(Math.round(tutorDetail.avg_student_rating)))}${"☆".repeat(5 - Math.round(tutorDetail.avg_student_rating))}`
                  : "No ratings yet",
              },
              {
                label: "Student Engagement",
                value: tutorDetail.avg_student_engagement !== null
                  ? tutorDetail.avg_student_engagement.toFixed(1)
                  : "N/A",
                icon: Users,
                description: tutorDetail.avg_student_engagement !== null
                  ? "Average engagement score"
                  : "No engagement data",
              },
              {
                label: "Rebook Rate",
                value: tutorDetail.rebook_rate !== null
                  ? `${tutorDetail.rebook_rate.toFixed(1)}%`
                  : "N/A",
                icon: TrendingUp,
                description: tutorDetail.rebook_rate !== null
                  ? "Follow-up booking rate"
                  : "No rebook data",
              },
            ]}
          />
        </div>

        {/* Reliability Stats (if medium/high risk) */}
        {(tutorDetail.tutor_churn_risk === 'medium' || tutorDetail.tutor_churn_risk === 'high') && (
          <div className="mb-8">
            <h3 className="mb-4 text-lg font-semibold text-foreground">Reliability Metrics (Last 30 Days)</h3>
            <StatGrid
              columns={3}
              stats={[
                {
                  label: "No-Shows",
                  value: tutorDetail.no_show_count_30d,
                  variant: tutorDetail.no_show_count_30d >= 2 ? "danger" : "default",
                  description: "Tutor no-shows",
                },
                {
                  label: "Reschedules",
                  value: tutorDetail.reschedule_count_30d,
                  variant: tutorDetail.reschedule_count_30d >= 4 ? "danger" : "default",
                  description: "Tutor-initiated reschedules",
                },
                {
                  label: "Late Arrivals",
                  value: tutorDetail.late_count_30d,
                  description: "Sessions started >5min late",
                },
              ]}
            />
          </div>
        )}

        {/* Bio Section */}
        {tutorDetail.bio && (
          <div className="mb-8">
            <h3 className="mb-4 text-lg font-semibold text-foreground">About</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {tutorDetail.bio}
            </p>
          </div>
        )}

        {/* Performance Trends Section */}
        <SectionContainer
          title="Performance Trends (Last 30 Days)"
          description="Track session quality, engagement, and satisfaction over time"
          variant="default"
          className="mb-8"
        >
          <PerformanceTrendsSection
            trends={performanceTrends.map(t => ({
              date: t.date,
              sessionScore: t.sessionScore ?? undefined,
              engagement: t.engagement ?? undefined,
              satisfaction: t.satisfaction ?? undefined,
            }))}
          />
        </SectionContainer>

        {/* Actionable Insights Panel */}
        <div className="mb-8">
          <h3 className="mb-4 text-lg font-semibold text-foreground">Actionable Insights</h3>
          <div className="grid gap-6 md:grid-cols-3">
            {/* Strengths Section */}
            <Card className="border-l-4 border-l-green-500">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                  Strengths
                </CardTitle>
              </CardHeader>
              <CardContent>
                {insightsData.strengths.length > 0 ? (
                  <ul className="space-y-2">
                    {insightsData.strengths.slice(0, 5).map((strength) => (
                      <li key={strength.id} className="text-sm">
                        <span className="text-foreground">{strength.display_text}</span>
                        {strength.metric_value && (
                          <span className="ml-1 text-muted-foreground">
                            ({strength.metric_value})
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Complete more sessions to identify strengths
                  </p>
                )}
                {insightsData.strengths.length > 5 && (
                  <Button variant="link" size="sm" className="mt-2 px-0">
                    View All ({insightsData.strengths.length})
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Growth Opportunities Section */}
            <Card className="border-l-4 border-l-yellow-500">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Lightbulb className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                  Growth Opportunities
                </CardTitle>
              </CardHeader>
              <CardContent>
                {insightsData.growth_opportunities.length > 0 ? (
                  <ul className="space-y-2">
                    {insightsData.growth_opportunities.slice(0, 5).map((opportunity) => (
                      <li key={opportunity.id} className="text-sm">
                        <span className="text-foreground">{opportunity.display_text}</span>
                        {opportunity.metric_value && (
                          <span className="ml-1 text-muted-foreground">
                            ({opportunity.metric_value})
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No specific growth areas identified - keep up the great work!
                  </p>
                )}
                {insightsData.growth_opportunities.length > 5 && (
                  <Button variant="link" size="sm" className="mt-2 px-0">
                    View All ({insightsData.growth_opportunities.length})
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Active Alerts Section */}
            {alertsData.length > 0 && (
              <Card className="border-l-4 border-l-red-500">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
                    Active Alerts ({alertsData.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {alertsData.slice(0, 3).map((alert) => (
                      <AlertCard
                        key={alert.id}
                        title={alert.title}
                        description={alert.description}
                        severity={alert.severity}
                        timestamp={alert.triggered_date}
                        sessionId={alert.session_id || undefined}
                        className="py-2"
                      />
                    ))}
                  </div>
                  {alertsData.length > 3 && (
                    <Button variant="link" size="sm" className="mt-2 px-0">
                      View All Alerts ({alertsData.length})
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Placeholder for no alerts */}
            {alertsData.length === 0 && (
              <Card className="border-l-4 border-l-gray-300 dark:border-l-gray-700">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <CheckCircle className="h-5 w-5 text-gray-500" />
                    All Clear
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    No active alerts - tutor performance is on track
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Session History Section */}
        <SectionContainer
          title="Session History"
          description={`All ${sessionHistory.length} sessions for this tutor`}
          variant="default"
          className="mb-8"
        >
          <SessionHistoryTable
            sessions={sessionHistory.map(s => ({
              ...s,
              scheduled_start: new Date(s.scheduled_start),
            }))}
            tutorId={id}
          />
        </SectionContainer>

        {/* Coaching Notes Section */}
        <SectionContainer
          title="Coaching Notes & Intervention Log"
          description="Track coaching conversations and system-generated insights"
          variant="default"
          className="mb-8"
        >
          {coachingNotesData.length > 0 ? (
            <div className="space-y-4">
              {/* Timeline */}
              <div className="relative space-y-6">
                {coachingNotesData.map((note, index) => (
                  <div key={note.id} className="relative flex gap-4">
                    {/* Timeline connector */}
                    {index !== coachingNotesData.length - 1 && (
                      <div className="absolute left-5 top-10 h-full w-px bg-border" />
                    )}

                    {/* Timeline dot */}
                    <div className={`relative flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border-2 ${
                      note.note_type === 'system'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                        : 'border-purple-500 bg-purple-50 dark:bg-purple-950'
                    }`}>
                      {note.note_type === 'system' ? (
                        <AlertTriangle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      ) : (
                        <MessageSquare className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                      )}
                    </div>

                    {/* Note content */}
                    <Card className={`flex-1 ${
                      note.note_type === 'system'
                        ? 'bg-muted/30'
                        : 'bg-background'
                    }`}>
                      <CardContent className="pt-4">
                        <div className="mb-2 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant={note.note_type === 'system' ? 'outline' : 'default'}>
                              {note.note_type === 'system' ? 'System' : 'Manual'}
                            </Badge>
                            {note.created_by_name && (
                              <span className="text-sm font-medium text-foreground">
                                {note.created_by_name}
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(note.created_at, { addSuffix: true })}
                          </span>
                        </div>
                        <p className="text-sm text-foreground leading-relaxed">
                          {note.content}
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/30 p-12 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <FileText className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-foreground">No coaching notes yet</h3>
              <p className="text-sm text-muted-foreground">
                Add the first note to track interventions and coaching conversations.
              </p>
            </div>
          )}
        </SectionContainer>
    </>
  )
}
