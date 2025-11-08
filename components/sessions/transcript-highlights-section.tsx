import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { HelpCircle, Lightbulb, AlertCircle, Heart, AlertTriangle, BookOpen, Clock } from "lucide-react"
import type { HighlightTypeType, TranscriptSpeakerType } from "@/lib/db/types"

interface TranscriptHighlight {
  id: string
  timestamp_seconds: number
  speaker: string
  text: string
  highlight_type: string
}

interface TranscriptHighlightsSectionProps {
  transcriptHighlights: TranscriptHighlight[]
}

/**
 * Format timestamp from seconds to MM:SS format
 */
function formatTimestamp(seconds: number): string {
  if (!seconds || seconds < 0) return "00:00"

  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60

  return `${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`
}

/**
 * Get icon component for highlight type
 */
function getHighlightIcon(type: string) {
  const iconClass = "h-4 w-4"

  switch (type) {
    case "strong_question":
      return <HelpCircle className={`${iconClass} text-blue-600`} />
    case "breakthrough":
      return <Lightbulb className={`${iconClass} text-green-600`} />
    case "confusion":
      return <AlertCircle className={`${iconClass} text-yellow-600`} />
    case "positive_reinforcement":
      return <Heart className={`${iconClass} text-pink-600`} />
    case "concern":
      return <AlertTriangle className={`${iconClass} text-red-600`} />
    case "concept_explanation":
      return <BookOpen className={`${iconClass} text-blue-600`} />
    default:
      return <Clock className={`${iconClass} text-gray-600`} />
  }
}

/**
 * Get display label for highlight type
 */
function getHighlightLabel(type: string): string {
  const labels: Record<string, string> = {
    strong_question: "Strong Question",
    breakthrough: "Breakthrough",
    confusion: "Confusion",
    positive_reinforcement: "Positive Reinforcement",
    concern: "Concern",
    concept_explanation: "Concept Explanation",
  }

  return labels[type] || type
}

/**
 * Get badge variant for highlight type
 */
function getHighlightBadgeVariant(type: string): "default" | "destructive" | "secondary" {
  switch (type) {
    case "breakthrough":
    case "positive_reinforcement":
      return "default"
    case "concern":
      return "destructive"
    default:
      return "secondary"
  }
}

export default function TranscriptHighlightsSection({ transcriptHighlights }: TranscriptHighlightsSectionProps) {
  if (!transcriptHighlights || transcriptHighlights.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Transcript Highlights</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No transcript highlights available for this session.
          </p>
        </CardContent>
      </Card>
    )
  }

  // Sort by timestamp and limit to 5
  const sortedHighlights = [...transcriptHighlights]
    .sort((a, b) => a.timestamp_seconds - b.timestamp_seconds)
    .slice(0, 5)

  const totalHighlights = transcriptHighlights.length

  return (
    <Card>
      <CardHeader>
        <CardTitle>Transcript Highlights</CardTitle>
        {totalHighlights > 5 && (
          <p className="text-sm text-muted-foreground">
            Showing 5 of {totalHighlights} highlights
          </p>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sortedHighlights.map((highlight) => (
            <Card key={highlight.id} className="border-l-4 border-l-blue-500">
              <CardContent className="pt-4">
                <div className="space-y-3">
                  {/* Header: Timestamp, Speaker, Type */}
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="font-mono text-xs">
                      <Clock className="mr-1 h-3 w-3" />
                      {formatTimestamp(highlight.timestamp_seconds)}
                    </Badge>

                    <Badge
                      variant={highlight.speaker === "tutor" ? "default" : "secondary"}
                    >
                      {highlight.speaker === "tutor" ? "Tutor" : "Student"}
                    </Badge>

                    <Badge
                      variant={getHighlightBadgeVariant(highlight.highlight_type)}
                      className="flex items-center gap-1"
                    >
                      {getHighlightIcon(highlight.highlight_type)}
                      {getHighlightLabel(highlight.highlight_type)}
                    </Badge>
                  </div>

                  {/* Transcript text */}
                  <p className="text-sm leading-relaxed text-foreground">
                    "{highlight.text}"
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Note about full transcript */}
          <p className="text-xs text-muted-foreground text-center mt-4">
            View Full Transcript (not available in MVP)
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
