import { getActionableInsights } from '@/services/dashboard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { ActionableInsightCard } from '@/app/dashboard/action-center/_components/actionable-insight-card';
import { EmptyState } from '@/components/ui/empty-state';
import { Lightbulb } from 'lucide-react';

export async function TopInsightsSummary() {
  // Fetch top 5 growth area insights
  const growthInsights = await getActionableInsights('growth_area', 5);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              Top Growth Opportunities
            </CardTitle>
            <CardDescription>
              Key areas where tutors can improve
            </CardDescription>
          </div>
          <Link href="/dashboard/action-center?tab=insights&type=growth_area">
            <Button variant="outline" size="sm" className="gap-2">
              View All
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {growthInsights.length > 0 ? (
          <div className="flex flex-col gap-4 max-h-[600px] overflow-y-auto">
            {growthInsights.map((insight) => (
              <div key={insight.id}>
                <ActionableInsightCard insight={insight} />
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Lightbulb}
            title="No growth opportunities detected"
            description="All tutors are performing optimally. New insights will appear as patterns emerge."
            className="py-8"
          />
        )}
      </CardContent>
    </Card>
  );
}
