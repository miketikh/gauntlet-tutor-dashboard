import { Suspense } from 'react';
import { PerformanceSummary } from '@/components/algorithm/performance-summary';
import { WeightPanel } from '@/components/algorithm/weight-panel';
import { LearningEventsFeed } from '@/components/algorithm/learning-events-feed';
import { getCurrentAlgorithmWeights, calculateRetroactiveAccuracy, getLearningEvents } from '@/services/churn-service';

export const dynamic = 'force-dynamic';

async function AlgorithmDashboardContent() {
  // Fetch data from services
  const [currentWeights, accuracyMetrics, learningEvents] = await Promise.all([
    getCurrentAlgorithmWeights(),
    calculateRetroactiveAccuracy(await getCurrentAlgorithmWeights()),
    getLearningEvents(20),
  ]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Algorithm Refinement Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Monitor and improve churn prediction accuracy through data-driven weight adjustments
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          Last updated: {new Date().toLocaleString()}
        </p>
      </div>

      {/* Section 1: Model Performance Summary (full width) */}
      <PerformanceSummary accuracyMetrics={accuracyMetrics} />

      {/* Sections 2 & 3: Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Section 2: Churn Prediction Factors & Weights (left column) */}
        <div className="lg:col-span-1">
          <WeightPanel
            weights={currentWeights}
            onWeightsChange={() => {
              // Client-side handler (will be handled in client component wrapper)
            }}
          />
        </div>

        {/* Section 3: Recent Learning Events (right column) */}
        <div className="lg:col-span-1">
          <LearningEventsFeed
            events={learningEvents}
            maxEvents={20}
          />
        </div>
      </div>

      {/* Section 4: Quick Actions panel */}
      <div className="border rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <div className="text-sm text-muted-foreground">
            Additional actions will be available after implementing server actions
          </div>
        </div>
      </div>
    </div>
  );
}

export default async function AlgorithmPage() {
  return (
    <div className="container mx-auto py-6 px-4">
      <Suspense fallback={<AlgorithmDashboardSkeleton />}>
        <AlgorithmDashboardContent />
      </Suspense>
    </div>
  );
}

function AlgorithmDashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div>
        <div className="h-8 bg-gray-200 rounded w-1/3 mb-2" />
        <div className="h-4 bg-gray-200 rounded w-2/3" />
      </div>
      <div className="h-64 bg-gray-200 rounded" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-96 bg-gray-200 rounded" />
        <div className="h-96 bg-gray-200 rounded" />
      </div>
    </div>
  );
}
