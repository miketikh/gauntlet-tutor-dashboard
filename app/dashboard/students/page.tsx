import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function StudentsPage() {
  return (
    <>
      <PageHeader
        title="Students"
        description="View student activity and churn risk analysis"
      />

      <Card>
        <CardHeader>
          <CardTitle>Students Page Coming Soon</CardTitle>
          <CardDescription>
            This page will display student profiles, session history, and churn risk indicators.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Features will include churn prediction, engagement tracking, and student journey analysis.
          </p>
        </CardContent>
      </Card>
    </>
  );
}
