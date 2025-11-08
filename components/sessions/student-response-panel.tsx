import { MetricCard } from "@/components/ui/metric-card"
import { Progress } from "@/components/ui/progress"
import { Clock, AlertCircle, MessageCircle } from "lucide-react"

interface StudentResponsePanelProps {
  audioMetrics: {
    avg_student_response_delay: string | null
    student_frustration_count: number
    student_initiated_questions: number
    productive_silence_ratio: string | null
    awkward_pause_ratio: string | null
  }
}

export default function StudentResponsePanel({ audioMetrics }: StudentResponsePanelProps) {
  const responseDelay = audioMetrics.avg_student_response_delay
    ? parseFloat(audioMetrics.avg_student_response_delay)
    : 0
  const frustrationCount = audioMetrics.student_frustration_count
  const initiatedQuestions = audioMetrics.student_initiated_questions
  const productiveSilence = audioMetrics.productive_silence_ratio
    ? parseFloat(audioMetrics.productive_silence_ratio) * 100
    : 0
  const awkwardPauses = audioMetrics.awkward_pause_ratio
    ? parseFloat(audioMetrics.awkward_pause_ratio) * 100
    : 0

  // Determine response delay context
  const getResponseDelayContext = (delay: number) => {
    if (delay < 3) return { label: "Great", color: "text-green-600" }
    if (delay <= 5) return { label: "Good", color: "text-foreground" }
    return { label: "Consider pacing", color: "text-yellow-600" }
  }

  // Determine frustration severity
  const getFrustrationSeverity = (count: number) => {
    if (count <= 1) return { label: "Low severity", color: "text-green-600" }
    if (count <= 3) return { label: "Medium severity", color: "text-yellow-600" }
    return { label: "High severity", color: "text-red-600" }
  }

  const delayContext = getResponseDelayContext(responseDelay)
  const frustrationSeverity = getFrustrationSeverity(frustrationCount)

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Average Response Delay */}
      <MetricCard
        title="Avg Response Delay"
        value={`${responseDelay.toFixed(1)}s`}
        description="Average time for student to respond"
        icon={Clock}
      >
        <div className="mt-2">
          <span className={`text-sm font-medium ${delayContext.color}`}>
            {delayContext.label}
          </span>
        </div>
      </MetricCard>

      {/* Frustration Signals */}
      <MetricCard
        title="Frustration Signals"
        value={frustrationCount.toString()}
        description="Times student showed frustration"
        icon={AlertCircle}
      >
        <div className="mt-2">
          <span className={`text-sm font-medium ${frustrationSeverity.color}`}>
            {frustrationSeverity.label}
          </span>
        </div>
      </MetricCard>

      {/* Student Initiated Questions */}
      <MetricCard
        title="Student Initiated Questions"
        value={initiatedQuestions.toString()}
        description="Questions asked by student"
        icon={MessageCircle}
      >
        <div className="mt-2">
          <MessageCircle className="h-8 w-8 text-blue-500" />
        </div>
      </MetricCard>

      {/* Pause Analysis */}
      <MetricCard
        title="Pause Analysis"
        value={`${productiveSilence.toFixed(0)}%`}
        description="Productive silence vs awkward pauses"
        icon={Clock}
      >
        <div className="mt-3 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Productive silence</span>
            <span className="font-medium">{productiveSilence.toFixed(0)}%</span>
          </div>
          <Progress value={productiveSilence} className="bg-green-100" />

          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Awkward pauses</span>
            <span className="font-medium">{awkwardPauses.toFixed(0)}%</span>
          </div>
          <Progress value={awkwardPauses} className="bg-yellow-100" />

          <p className="text-xs text-muted-foreground mt-2">
            Productive silence is healthy for thinking time
          </p>
        </div>
      </MetricCard>
    </div>
  )
}
