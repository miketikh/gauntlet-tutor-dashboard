import { getAllTutorsWithMetrics } from "@/services/tutor-service"
import { PageHeader } from "@/components/ui/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScoreBadge } from "@/components/ui/score-badge"
import { Badge } from "@/components/ui/badge"
import { User, Calendar, X, AlertTriangle, AlertCircle, TrendingUp, Sparkles } from "lucide-react"
import { format } from "date-fns"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type TutorsPageProps = {
  searchParams: Promise<{ churnRisk?: string }>
}

export default async function TutorsListPage({ searchParams }: TutorsPageProps) {
  // Parse query params
  const params = await searchParams
  const churnRiskParam = params.churnRisk
  const churnRiskFilter = churnRiskParam ? churnRiskParam.split(',') : undefined

  // Fetch all tutors with metrics in single efficient query
  const tutorsWithMetrics = await getAllTutorsWithMetrics({
    churnRisk: churnRiskFilter
  })

  // Sort by score descending (highest first)
  const sortedTutors = tutorsWithMetrics.sort((a, b) => {
    if (a.overall_score === null) return 1
    if (b.overall_score === null) return -1
    return b.overall_score - a.overall_score
  })

  return (
    <>
      <div className="flex items-center justify-between">
        <PageHeader
          title="Tutors"
          description={`${sortedTutors.length} tutors${churnRiskFilter ? ' (filtered)' : ''}`}
        />
        {churnRiskFilter && (
          <Badge variant="outline" className="gap-2">
            <AlertTriangle className="h-3 w-3" />
            Churn Risk: {churnRiskFilter.join(', ')}
            <Link href="/dashboard/tutors">
              <X className="h-3 w-3 cursor-pointer hover:text-destructive" />
            </Link>
          </Badge>
        )}
      </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {sortedTutors.map((tutor) => (
            <Link key={tutor.user_id} href={`/dashboard/tutors/${tutor.user_id}`}>
              <Card className="h-full transition-all hover:shadow-md hover:border-primary/50 cursor-pointer">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-muted">
                        <User className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg flex items-center gap-2">
                          {tutor.name}
                          {(tutor.churn_risk_level === 'medium' || tutor.churn_risk_level === 'high') && (
                            <span className="text-base" title={`${tutor.churn_risk_level} churn risk`}>⚠️</span>
                          )}
                        </CardTitle>
                        <p className="text-xs text-muted-foreground truncate">{tutor.email}</p>

                        {/* Insight/Alert Badges */}
                        <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                          {tutor.overall_score !== null && (
                            <ScoreBadge score={tutor.overall_score} size="sm" />
                          )}
                          {tutor.critical_alert_count > 0 && (
                            <Badge variant="destructive" className="text-xs gap-1">
                              <AlertCircle className="h-3 w-3" />
                              {tutor.critical_alert_count} critical
                            </Badge>
                          )}
                          {tutor.alert_count > 0 && tutor.critical_alert_count === 0 && (
                            <Badge variant="outline" className="text-xs gap-1 border-yellow-500 text-yellow-700 dark:text-yellow-500">
                              <AlertTriangle className="h-3 w-3" />
                              {tutor.alert_count} alert{tutor.alert_count > 1 ? 's' : ''}
                            </Badge>
                          )}
                          {tutor.growth_insight_count > 0 && (
                            <Badge variant="outline" className="text-xs gap-1 border-blue-500 text-blue-700 dark:text-blue-400">
                              <TrendingUp className="h-3 w-3" />
                              {tutor.growth_insight_count} growth
                            </Badge>
                          )}
                          {tutor.strength_insight_count > 0 && (
                            <Badge variant="outline" className="text-xs gap-1 border-green-500 text-green-700 dark:text-green-400">
                              <Sparkles className="h-3 w-3" />
                              {tutor.strength_insight_count} strength{tutor.strength_insight_count > 1 ? 's' : ''}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {/* Bio */}
                    {tutor.bio && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {tutor.bio}
                      </p>
                    )}

                    {/* Member Since */}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>Member since {format(new Date(tutor.member_since), "MMM yyyy")}</span>
                    </div>

                    {/* Hourly Rate */}
                    {tutor.hourly_rate && (
                      <div className="flex items-center justify-between">
                        <Badge variant="outline">${tutor.hourly_rate}/hr</Badge>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Empty State */}
        {sortedTutors.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/30 p-12 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <User className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-foreground">No tutors yet</h3>
            <p className="text-sm text-muted-foreground">
              Tutors will appear here once they are added to the system.
            </p>
          </div>
        )}
    </>
  )
}
