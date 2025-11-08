import type { SessionWithMetrics } from "@/services/session-service"
import MetricsSection from "./metrics-section"

interface MetricsLayoutWrapperProps {
  sessionData: SessionWithMetrics
}

export default function MetricsLayoutWrapper({ sessionData }: MetricsLayoutWrapperProps) {
  return <MetricsSection sessionData={sessionData} />
}
