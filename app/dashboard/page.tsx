import { Suspense } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PageHeader } from "@/components/ui/page-header"
import Link from "next/link"
import { PlatformMetricsBar } from "@/app/dashboard/_components/platform-metrics-bar"
import { PlatformMetricsSkeleton } from "@/app/dashboard/_components/platform-metrics-skeleton"
import { TutorScoreboard } from "@/app/dashboard/_components/tutor-scoreboard"
import { LoadingCard } from "@/components/ui/loading-card"
import { RecentSessionsFeed } from "@/app/dashboard/_components/recent-sessions-feed"
import { Button } from "@/components/ui/button"

export default async function DashboardPage() {
  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Monitor and analyze tutor performance across your platform"
      />

        {/* Platform Health Metrics */}
        <Suspense fallback={<PlatformMetricsSkeleton />}>
          <PlatformMetricsBar />
        </Suspense>

        {/* Tutor Scoreboard */}
        <div className="mt-8">
          <Suspense
            fallback={
              <div className="grid gap-6 md:grid-cols-[2fr_1fr]">
                <LoadingCard variant="list" count={10} />
                <LoadingCard variant="list" count={5} />
              </div>
            }
          >
            <TutorScoreboard />
          </Suspense>
        </div>

        {/* Recent Sessions Feed */}
        <div className="mt-8">
          <Suspense fallback={<LoadingCard variant="list" count={20} />}>
            <RecentSessionsFeed />
          </Suspense>
        </div>

    </>
  );
}