import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, Lightbulb, Clock } from "lucide-react"
import { Separator } from "@/components/ui/separator"

interface AIAnalysisSectionProps {
  aiSummary: string | null
}

interface ParsedSummary {
  summary: string
  strengths: string[]
  growthAreas: string[]
  keyMoments?: Array<{ timestamp: string; description: string }>
}

/**
 * Parse AI summary text to extract structured sections
 * Expected format:
 * - First paragraph: overview/summary
 * - "What Went Well:" section with bullet points
 * - "Growth Opportunities:" section with bullet points
 * - Optional: "Key Moments:" section with timestamps
 */
function parseAISummary(summaryText: string): ParsedSummary {
  const result: ParsedSummary = {
    summary: "",
    strengths: [],
    growthAreas: [],
    keyMoments: [],
  }

  try {
    // Split by sections
    const lines = summaryText.split("\n").map((l) => l.trim()).filter((l) => l)

    let currentSection: "summary" | "strengths" | "growth" | "moments" = "summary"
    const summaryLines: string[] = []

    for (const line of lines) {
      // Detect section headers
      if (line.toLowerCase().includes("what went well")) {
        currentSection = "strengths"
        continue
      } else if (line.toLowerCase().includes("growth opportunities")) {
        currentSection = "growth"
        continue
      } else if (line.toLowerCase().includes("key moments")) {
        currentSection = "moments"
        continue
      }

      // Add content to appropriate section
      if (currentSection === "summary") {
        summaryLines.push(line)
      } else if (currentSection === "strengths") {
        // Remove bullet points and add to strengths
        const cleaned = line.replace(/^[-*•]\s*/, "")
        if (cleaned) result.strengths.push(cleaned)
      } else if (currentSection === "growth") {
        // Remove bullet points and add to growth areas
        const cleaned = line.replace(/^[-*•]\s*/, "")
        if (cleaned) result.growthAreas.push(cleaned)
      } else if (currentSection === "moments") {
        // Parse timestamp and description (e.g., "12:34 - Student had breakthrough")
        const timestampMatch = line.match(/^(\d{1,2}:\d{2})\s*[-:]\s*(.+)/)
        if (timestampMatch) {
          result.keyMoments?.push({
            timestamp: timestampMatch[1],
            description: timestampMatch[2],
          })
        }
      }
    }

    result.summary = summaryLines.join(" ")
  } catch (error) {
    // If parsing fails, return the raw summary
    console.error("Failed to parse AI summary:", error)
    result.summary = summaryText
  }

  return result
}

export default function AIAnalysisSection({ aiSummary }: AIAnalysisSectionProps) {
  if (!aiSummary) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>AI Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            AI analysis not yet available for this session.
          </p>
        </CardContent>
      </Card>
    )
  }

  const parsed = parseAISummary(aiSummary)

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Analysis</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary Paragraph */}
        {parsed.summary && (
          <div>
            <p className="text-base leading-relaxed text-foreground">
              {parsed.summary}
            </p>
          </div>
        )}

        {/* What Went Well Section */}
        {parsed.strengths.length > 0 && (
          <>
            <Separator />
            <div>
              <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold text-green-700 dark:text-green-500">
                <CheckCircle className="h-5 w-5" />
                What Went Well
              </h3>
              <ul className="space-y-2">
                {parsed.strengths.map((strength, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <CheckCircle className="mt-1 h-4 w-4 flex-shrink-0 text-green-600 dark:text-green-500" />
                    <span className="text-sm text-foreground">{strength}</span>
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}

        {/* Growth Opportunities Section */}
        {parsed.growthAreas.length > 0 && (
          <>
            <Separator />
            <div>
              <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold text-yellow-700 dark:text-yellow-500">
                <Lightbulb className="h-5 w-5" />
                Growth Opportunities
              </h3>
              <ul className="space-y-2">
                {parsed.growthAreas.map((area, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <Lightbulb className="mt-1 h-4 w-4 flex-shrink-0 text-yellow-600 dark:text-yellow-500" />
                    <span className="text-sm text-foreground">{area}</span>
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}

        {/* Key Moments Section */}
        {parsed.keyMoments && parsed.keyMoments.length > 0 && (
          <>
            <Separator />
            <div>
              <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold text-blue-700 dark:text-blue-500">
                <Clock className="h-5 w-5" />
                Key Moments
              </h3>
              <ul className="space-y-2">
                {parsed.keyMoments.map((moment, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <Clock className="mt-1 h-4 w-4 flex-shrink-0 text-blue-600 dark:text-blue-500" />
                    <div className="text-sm">
                      <span className="font-mono font-semibold text-blue-600 dark:text-blue-400">
                        {moment.timestamp}
                      </span>
                      <span className="ml-2 text-foreground">{moment.description}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}

        {/* Fallback if no structured data */}
        {!parsed.summary && parsed.strengths.length === 0 && parsed.growthAreas.length === 0 && (
          <div className="text-sm text-muted-foreground">
            <p>{aiSummary}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
