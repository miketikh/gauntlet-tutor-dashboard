import { MetricCard } from "@/components/ui/metric-card"
import { ScoreBadge } from "@/components/ui/score-badge"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Eye, FileText, AlertCircle, CheckCircle2 } from "lucide-react"

interface VisualEngagementPanelProps {
  videoMetrics: {
    student_on_screen_attention_pct: string | null
    student_visual_engagement_score: string | null
    student_taking_notes_duration: number
    distraction_events_count: number
    tutor_uses_visual_aids: boolean
  }
}

export default function VisualEngagementPanel({ videoMetrics }: VisualEngagementPanelProps) {
  const attentionPct = videoMetrics.student_on_screen_attention_pct
    ? parseFloat(videoMetrics.student_on_screen_attention_pct) * 100
    : 0
  const visualEngagement = videoMetrics.student_visual_engagement_score
    ? parseFloat(videoMetrics.student_visual_engagement_score)
    : 0
  const noteTakingDuration = videoMetrics.student_taking_notes_duration
  const distractionEvents = videoMetrics.distraction_events_count
  const usesVisualAids = videoMetrics.tutor_uses_visual_aids

  // Determine distraction severity
  const getDistractionContext = (count: number) => {
    if (count <= 2) return { label: "Focused", color: "text-green-600" }
    if (count <= 5) return { label: "Some distractions", color: "text-yellow-600" }
    return { label: "Frequently distracted", color: "text-red-600" }
  }

  const distractionContext = getDistractionContext(distractionEvents)

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* On-Screen Attention */}
      <MetricCard
        title="On-Screen Attention"
        value={`${attentionPct.toFixed(0)}%`}
        description="Percentage of time student looked at screen"
        icon={Eye}
      >
        <div className="mt-2">
          <Progress value={attentionPct} className="mt-2" />
        </div>
      </MetricCard>

      {/* Visual Engagement Score */}
      <MetricCard
        title="Visual Engagement Score"
        value={visualEngagement.toFixed(1)}
        description="Overall visual engagement level (0-10)"
        icon={Eye}
      >
        <div className="mt-2">
          <ScoreBadge score={visualEngagement} size="md" />
          <Progress value={visualEngagement * 10} className="mt-2" />
        </div>
      </MetricCard>

      {/* Note-Taking Duration */}
      <MetricCard
        title="Note-Taking Duration"
        value={`${noteTakingDuration} min`}
        description="Time spent taking notes"
        icon={FileText}
      >
        <div className="mt-2">
          <FileText className="h-8 w-8 text-blue-500" />
        </div>
      </MetricCard>

      {/* Distraction Events */}
      <MetricCard
        title="Distraction Events"
        value={distractionEvents.toString()}
        description="Number of times student was distracted"
        icon={AlertCircle}
      >
        <div className="mt-2 space-y-2">
          <span className={`text-sm font-medium ${distractionContext.color}`}>
            {distractionContext.label}
          </span>

          {usesVisualAids && (
            <Badge className="mt-2 bg-green-600 hover:bg-green-700">
              <CheckCircle2 className="mr-1 h-3 w-3" />
              Visual aids used
            </Badge>
          )}
        </div>
      </MetricCard>
    </div>
  )
}
