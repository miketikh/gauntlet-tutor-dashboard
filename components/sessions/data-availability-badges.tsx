import { Badge } from "@/components/ui/badge"
import { CheckCircle2, XCircle } from "lucide-react"

interface DataAvailabilityBadgesProps {
  hasAudioAnalysis: boolean
  hasVideoAnalysis: boolean
  hasScreenMonitoring: boolean
}

export default function DataAvailabilityBadges({
  hasAudioAnalysis,
  hasVideoAnalysis,
  hasScreenMonitoring,
}: DataAvailabilityBadgesProps) {
  return (
    <div className="flex flex-wrap gap-3">
      {/* Audio Analysis - always available for completed sessions */}
      <Badge
        variant={hasAudioAnalysis ? "default" : "secondary"}
        className={hasAudioAnalysis ? "bg-green-600 hover:bg-green-700" : "bg-gray-400"}
      >
        {hasAudioAnalysis ? (
          <CheckCircle2 className="mr-1 h-3 w-3" />
        ) : (
          <XCircle className="mr-1 h-3 w-3" />
        )}
        Audio Analysis
      </Badge>

      {/* Video Analysis */}
      <Badge
        variant={hasVideoAnalysis ? "default" : "secondary"}
        className={hasVideoAnalysis ? "bg-green-600 hover:bg-green-700" : "bg-gray-400"}
      >
        {hasVideoAnalysis ? (
          <CheckCircle2 className="mr-1 h-3 w-3" />
        ) : (
          <XCircle className="mr-1 h-3 w-3" />
        )}
        Video Analysis
      </Badge>

      {/* Screen Monitoring */}
      <Badge
        variant={hasScreenMonitoring ? "default" : "secondary"}
        className={hasScreenMonitoring ? "bg-green-600 hover:bg-green-700" : "bg-gray-400"}
      >
        {hasScreenMonitoring ? (
          <CheckCircle2 className="mr-1 h-3 w-3" />
        ) : (
          <XCircle className="mr-1 h-3 w-3" />
        )}
        Screen Monitoring
      </Badge>
    </div>
  )
}
