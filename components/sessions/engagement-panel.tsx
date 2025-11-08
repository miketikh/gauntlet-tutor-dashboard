import { MetricCard } from "@/components/ui/metric-card"
import { ScoreBadge } from "@/components/ui/score-badge"
import { Progress } from "@/components/ui/progress"
import { MessageSquare, HelpCircle } from "lucide-react"

interface EngagementPanelProps {
  audioMetrics: {
    student_talk_ratio: string | null
    tutor_talk_ratio: string | null
    student_engagement_score: string | null
    tutor_checks_understanding_count: number
  }
}

export default function EngagementPanel({ audioMetrics }: EngagementPanelProps) {
  const studentTalkRatio = audioMetrics.student_talk_ratio
    ? parseFloat(audioMetrics.student_talk_ratio) * 100
    : 0
  const tutorTalkRatio = audioMetrics.tutor_talk_ratio
    ? parseFloat(audioMetrics.tutor_talk_ratio) * 100
    : 0
  const engagementScore = audioMetrics.student_engagement_score
    ? parseFloat(audioMetrics.student_engagement_score)
    : 0
  const understandingChecks = audioMetrics.tutor_checks_understanding_count

  // Determine understanding checks context
  const getUnderstandingChecksContext = (count: number) => {
    if (count >= 10) return { label: "Excellent", color: "text-green-600" }
    if (count >= 5) return { label: "Good", color: "text-foreground" }
    return { label: "Needs Improvement", color: "text-yellow-600" }
  }

  const checksContext = getUnderstandingChecksContext(understandingChecks)

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Student Engagement Score */}
      <MetricCard
        title="Student Engagement Score"
        value={engagementScore.toFixed(1)}
        description="Overall engagement level (0-10)"
        icon={MessageSquare}
      >
        <div className="mt-2">
          <ScoreBadge score={engagementScore} size="md" />
          <Progress value={engagementScore * 10} className="mt-2" />
        </div>
      </MetricCard>

      {/* Student Talk Ratio */}
      <MetricCard
        title="Student Talk Ratio"
        value={`${studentTalkRatio.toFixed(0)}%`}
        description="Percentage of time student spoke"
        icon={MessageSquare}
      >
        <div className="mt-2 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Student</span>
            <span className="font-medium">{studentTalkRatio.toFixed(0)}%</span>
          </div>
          <Progress value={studentTalkRatio} className="bg-blue-100" />
        </div>
      </MetricCard>

      {/* Tutor Talk Ratio */}
      <MetricCard
        title="Tutor Talk Ratio"
        value={`${tutorTalkRatio.toFixed(0)}%`}
        description="Percentage of time tutor spoke"
        icon={MessageSquare}
      >
        <div className="mt-2 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Tutor</span>
            <span className="font-medium">{tutorTalkRatio.toFixed(0)}%</span>
          </div>
          <Progress value={tutorTalkRatio} className="bg-purple-100" />
        </div>
      </MetricCard>

      {/* Understanding Checks */}
      <MetricCard
        title="Understanding Checks"
        value={understandingChecks.toString()}
        description="Times tutor checked understanding"
        icon={HelpCircle}
      >
        <div className="mt-2">
          <span className={`text-sm font-medium ${checksContext.color}`}>
            {checksContext.label}
          </span>
        </div>
      </MetricCard>
    </div>
  )
}
