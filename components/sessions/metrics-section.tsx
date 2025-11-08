"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { SessionWithMetrics } from "@/services/session-service"
import EngagementPanel from "./engagement-panel"
import CommunicationPanel from "./communication-panel"
import StudentResponsePanel from "./student-response-panel"
import VisualEngagementPanel from "./visual-engagement-panel"
import TechnicalEnvironmentPanel from "./technical-environment-panel"

interface MetricsSectionProps {
  sessionData: SessionWithMetrics
}

export default function MetricsSection({ sessionData }: MetricsSectionProps) {
  const { session, audioMetrics, videoMetrics, screenMetrics } = sessionData

  // Determine which tabs to show
  const showEngagement = session.has_audio_analysis && audioMetrics !== null
  const showCommunication = session.has_audio_analysis && audioMetrics !== null
  const showStudentResponse = session.has_audio_analysis && audioMetrics !== null
  const showVisual = session.has_video_analysis && videoMetrics !== null
  const showTechnical = session.has_screen_monitoring && screenMetrics !== null

  return (
    <Card>
      <CardContent className="pt-6">
        <Tabs defaultValue="engagement" className="w-full">
          <TabsList className="grid w-full grid-cols-3 md:grid-cols-5">
            <TabsTrigger
              value="engagement"
              disabled={!showEngagement}
            >
              Engagement
            </TabsTrigger>
            <TabsTrigger
              value="communication"
              disabled={!showCommunication}
            >
              Communication
            </TabsTrigger>
            <TabsTrigger
              value="student-response"
              disabled={!showStudentResponse}
            >
              Student Response
            </TabsTrigger>
            <TabsTrigger
              value="visual"
              disabled={!showVisual}
            >
              Visual
            </TabsTrigger>
            <TabsTrigger
              value="technical"
              disabled={!showTechnical}
            >
              Technical
            </TabsTrigger>
          </TabsList>

          {/* Engagement Tab */}
          <TabsContent value="engagement" className="mt-6">
            {showEngagement && audioMetrics ? (
              <EngagementPanel audioMetrics={audioMetrics} />
            ) : (
              <p className="text-sm text-muted-foreground">
                Audio analysis not available for this session.
              </p>
            )}
          </TabsContent>

          {/* Communication Tab */}
          <TabsContent value="communication" className="mt-6">
            {showCommunication && audioMetrics ? (
              <CommunicationPanel audioMetrics={audioMetrics} />
            ) : (
              <p className="text-sm text-muted-foreground">
                Audio analysis not available for this session.
              </p>
            )}
          </TabsContent>

          {/* Student Response Tab */}
          <TabsContent value="student-response" className="mt-6">
            {showStudentResponse && audioMetrics ? (
              <StudentResponsePanel audioMetrics={audioMetrics} />
            ) : (
              <p className="text-sm text-muted-foreground">
                Audio analysis not available for this session.
              </p>
            )}
          </TabsContent>

          {/* Visual Tab */}
          <TabsContent value="visual" className="mt-6">
            {showVisual && videoMetrics ? (
              <VisualEngagementPanel videoMetrics={videoMetrics} />
            ) : (
              <p className="text-sm text-muted-foreground">
                Video analysis not available for this session.
              </p>
            )}
          </TabsContent>

          {/* Technical Tab */}
          <TabsContent value="technical" className="mt-6">
            {showTechnical && screenMetrics ? (
              <TechnicalEnvironmentPanel screenMetrics={screenMetrics} />
            ) : (
              <p className="text-sm text-muted-foreground">
                Screen monitoring not available for this session.
              </p>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
