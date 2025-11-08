import { PageHeader } from '@/components/ui/page-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserForm } from './_components/user-form';
import { SessionForm } from './_components/session-form';

export default function GeneratePage() {
  return (
    <>
      <PageHeader
        title="Data Generator"
        description="Create test data including users, sessions, and metrics"
      />

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users">Create User</TabsTrigger>
          <TabsTrigger value="sessions">
            Create Session
          </TabsTrigger>
          <TabsTrigger value="bulk" disabled>
            Bulk Generate
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <UserForm />
        </TabsContent>

        <TabsContent value="sessions" className="space-y-4">
          <SessionForm />
        </TabsContent>

        <TabsContent value="bulk">
          <p className="text-sm text-muted-foreground">Bulk generation coming in Phase 4</p>
        </TabsContent>
      </Tabs>
    </>
  );
}
