import { MetricCard } from "@/components/ui/metric-card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Monitor, PenTool, AlertTriangle, CheckCircle2 } from "lucide-react"

interface TechnicalEnvironmentPanelProps {
  screenMetrics: {
    active_tab_focus_pct: string | null
    tab_switches_count: number
    whiteboard_usage_minutes: number
    messaging_app_detected: boolean
    gaming_detected: boolean
  }
}

export default function TechnicalEnvironmentPanel({ screenMetrics }: TechnicalEnvironmentPanelProps) {
  const tabFocusPct = screenMetrics.active_tab_focus_pct
    ? parseFloat(screenMetrics.active_tab_focus_pct) * 100
    : 0
  const tabSwitches = screenMetrics.tab_switches_count
  const whiteboardUsage = screenMetrics.whiteboard_usage_minutes
  const messagingDetected = screenMetrics.messaging_app_detected
  const gamingDetected = screenMetrics.gaming_detected

  // Determine tab switch context
  const getTabSwitchContext = (count: number) => {
    if (count < 10) return { label: "Focused", color: "text-green-600" }
    if (count <= 20) return { label: "Moderate", color: "text-foreground" }
    return { label: "Highly distracted", color: "text-yellow-600" }
  }

  const tabSwitchContext = getTabSwitchContext(tabSwitches)
  const noOffTaskApps = !messagingDetected && !gamingDetected

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Active Tab Focus */}
      <MetricCard
        title="Active Tab Focus"
        value={`${tabFocusPct.toFixed(0)}%`}
        description="Percentage of time on active tab"
        icon={Monitor}
      >
        <div className="mt-2">
          <Progress value={tabFocusPct} className="mt-2" />
        </div>
      </MetricCard>

      {/* Whiteboard Usage */}
      <MetricCard
        title="Whiteboard Usage"
        value={`${whiteboardUsage} min`}
        description="Time using whiteboard or drawing tools"
        icon={PenTool}
      >
        <div className="mt-2">
          <PenTool className="h-8 w-8 text-purple-500" />
        </div>
      </MetricCard>

      {/* Tab Switch Count */}
      <MetricCard
        title="Tab Switch Count"
        value={tabSwitches.toString()}
        description="Number of times student switched tabs"
        icon={Monitor}
      >
        <div className="mt-2">
          <span className={`text-sm font-medium ${tabSwitchContext.color}`}>
            {tabSwitchContext.label}
          </span>
        </div>
      </MetricCard>

      {/* Off-task Application Usage */}
      <MetricCard
        title="Off-task Application Usage"
        value={noOffTaskApps ? "None" : "Detected"}
        description="Detected non-academic apps during session"
        icon={AlertTriangle}
      >
        <div className="mt-2 space-y-2">
          {messagingDetected && (
            <Badge variant="secondary" className="bg-yellow-500 hover:bg-yellow-600 text-white">
              <AlertTriangle className="mr-1 h-3 w-3" />
              Messaging detected
            </Badge>
          )}

          {gamingDetected && (
            <Badge variant="destructive">
              <AlertTriangle className="mr-1 h-3 w-3" />
              Gaming detected
            </Badge>
          )}

          {noOffTaskApps && (
            <Badge className="bg-green-600 hover:bg-green-700">
              <CheckCircle2 className="mr-1 h-3 w-3" />
              No off-task apps
            </Badge>
          )}
        </div>
      </MetricCard>
    </div>
  )
}
