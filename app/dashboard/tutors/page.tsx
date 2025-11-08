import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function TutorsPage() {
  return (
    <>
      <PageHeader
        title="Tutors"
        description="Manage and view all tutors on the platform"
      />

      <Card>
        <CardHeader>
          <CardTitle>Tutors Page Coming Soon</CardTitle>
          <CardDescription>
            This page will display a comprehensive list of all tutors with filtering and search capabilities.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Features will include tutor profiles, performance metrics, and bulk management tools.
          </p>
        </CardContent>
      </Card>
    </>
  );
}
