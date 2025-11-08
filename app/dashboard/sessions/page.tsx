import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function SessionsPage() {
  return (
    <>
      <PageHeader
        title="Sessions"
        description="Browse and analyze all tutoring sessions"
      />

      <Card>
        <CardHeader>
          <CardTitle>Sessions Page Coming Soon</CardTitle>
          <CardDescription>
            This page will display a searchable, filterable list of all sessions with detailed metrics.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Features will include advanced filtering, bulk actions, and export capabilities.
          </p>
        </CardContent>
      </Card>
    </>
  );
}
