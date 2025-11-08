import { MetricCard } from "@/components/ui/metric-card"
import { ScoreBadge } from "@/components/ui/score-badge"
import { Progress } from "@/components/ui/progress"
import { Smile, Heart, MessageCircle } from "lucide-react"

interface CommunicationPanelProps {
  audioMetrics: {
    tutor_enthusiasm_score: string | null
    tutor_positive_reinforcement_count: number
    open_ended_questions: number
    closed_ended_questions: number
    rhetorical_questions: number
  }
}

export default function CommunicationPanel({ audioMetrics }: CommunicationPanelProps) {
  const enthusiasmScore = audioMetrics.tutor_enthusiasm_score
    ? parseFloat(audioMetrics.tutor_enthusiasm_score)
    : 0
  const positiveReinforcement = audioMetrics.tutor_positive_reinforcement_count
  const openEndedQuestions = audioMetrics.open_ended_questions
  const closedEndedQuestions = audioMetrics.closed_ended_questions
  const rhetoricalQuestions = audioMetrics.rhetorical_questions

  // Calculate question quality metrics
  const totalQuestions = openEndedQuestions + closedEndedQuestions + rhetoricalQuestions
  const openEndedPercentage = totalQuestions > 0
    ? (openEndedQuestions / totalQuestions) * 100
    : 0

  // Determine question quality context
  const getQuestionQualityContext = (percentage: number) => {
    if (percentage >= 60) return { label: "Excellent", color: "text-green-600" }
    if (percentage >= 40) return { label: "Good", color: "text-foreground" }
    return { label: "Consider more open-ended questions", color: "text-yellow-600" }
  }

  const questionContext = getQuestionQualityContext(openEndedPercentage)

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Tutor Enthusiasm Score */}
      <MetricCard
        title="Tutor Enthusiasm Score"
        value={enthusiasmScore.toFixed(1)}
        description="Energy and engagement level (0-10)"
        icon={Smile}
      />

      {/* Positive Reinforcement */}
      <MetricCard
        title="Positive Reinforcement"
        value={positiveReinforcement.toString()}
        description="Times tutor gave positive feedback"
        icon={Heart}
      />

      {/* Question Quality Breakdown */}
      <MetricCard
        title="Question Quality Breakdown"
        value={`${openEndedPercentage.toFixed(0)}%`}
        description={`Open-ended: ${openEndedQuestions} | Closed: ${closedEndedQuestions} | Rhetorical: ${rhetoricalQuestions}`}
        icon={MessageCircle}
      />

      {/* Total Questions */}
      <MetricCard
        title="Total Questions Asked"
        value={totalQuestions.toString()}
        description={`${openEndedPercentage.toFixed(0)}% open-ended questions`}
        icon={MessageCircle}
      />
    </div>
  )
}
