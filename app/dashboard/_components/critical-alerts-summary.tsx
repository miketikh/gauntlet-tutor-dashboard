import { getActionableAlerts } from '@/services/dashboard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { ActionableAlertCard } from '@/app/dashboard/action-center/_components/actionable-alert-card';
import { EmptyState } from '@/components/ui/empty-state';
import { CheckCircle } from 'lucide-react';

export async function CriticalAlertsSummary() {
  // Fetch top 5 critical alerts
  const criticalAlerts = await getActionableAlerts('critical', 5);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
              Critical Alerts
            </CardTitle>
            <CardDescription>
              Urgent issues requiring immediate attention
            </CardDescription>
          </div>
          <Link href="/dashboard/action-center?tab=alerts&severity=critical">
            <Button variant="outline" size="sm" className="gap-2">
              View All
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {criticalAlerts.length > 0 ? (
          <div className="flex flex-col gap-4 max-h-[600px] overflow-y-auto">
            {criticalAlerts.map((alert) => (
              <div key={alert.id}>
                <ActionableAlertCard alert={alert} />
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={CheckCircle}
            title="No critical alerts"
            description="All critical issues have been addressed. Keep up the great work!"
            className="border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-950/50 py-8"
          />
        )}
      </CardContent>
    </Card>
  );
}
