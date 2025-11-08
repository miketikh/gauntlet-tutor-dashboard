import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function SettingsPage() {
  return (
    <>
      <PageHeader
        title="Settings"
        description="Configure platform settings and algorithm parameters"
      />

      <Card>
        <CardHeader>
          <CardTitle>Settings Page Coming Soon</CardTitle>
          <CardDescription>
            This page will allow you to configure churn prediction weights, alert thresholds, and system preferences.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Features will include algorithm configuration, notification settings, and user management.
          </p>
        </CardContent>
      </Card>
    </>
  );
}
