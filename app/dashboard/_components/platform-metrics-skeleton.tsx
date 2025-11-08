import { LoadingCard } from '@/components/ui/loading-card';

export function PlatformMetricsSkeleton() {
  return (
    <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
      <LoadingCard variant="metric" />
      <LoadingCard variant="metric" />
      <LoadingCard variant="metric" />
      <LoadingCard variant="metric" />
    </div>
  );
}
