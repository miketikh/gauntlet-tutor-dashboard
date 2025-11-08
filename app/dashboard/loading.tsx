import { LoadingCard } from '@/components/ui/loading-card';
import { PlatformMetricsSkeleton } from './_components/platform-metrics-skeleton';

export default function DashboardLoading() {
  return (
    <div className="space-y-8">
      {/* Page Header Skeleton */}
      <div className="space-y-2">
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        <div className="h-4 w-96 bg-muted animate-pulse rounded" />
      </div>

      {/* Platform Metrics Skeleton */}
      <PlatformMetricsSkeleton />

      {/* Tutor Scoreboard Skeleton */}
      <div className="grid gap-6 md:grid-cols-[2fr_1fr]">
        <LoadingCard variant="list" count={10} />
        <LoadingCard variant="list" count={5} />
      </div>

      {/* Recent Sessions Skeleton */}
      <LoadingCard variant="list" count={20} />
    </div>
  );
}
