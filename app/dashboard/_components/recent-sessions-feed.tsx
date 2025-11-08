import { getRecentSessions } from '@/services/dashboard';
import { SectionContainer } from '@/components/ui/section-container';
import { SessionFeedFilters } from './session-feed-filters';
import { SessionFeedList } from './session-feed-list';

export async function RecentSessionsFeed() {
  const sessions = await getRecentSessions(20);

  return (
    <SectionContainer
      variant="card"
      title="Recent Sessions"
      description="Latest session activity across your platform"
      actions={<SessionFeedFilters />}
    >
      <SessionFeedList sessions={sessions} />
    </SectionContainer>
  );
}
