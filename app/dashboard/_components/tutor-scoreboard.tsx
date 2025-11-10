import { SectionContainer } from '@/components/ui/section-container';
import { TopPerformersList } from './top-performers-list';

export function TutorScoreboard() {
  return (
    <SectionContainer variant="card" title="Top Performers 🌟">
      <TopPerformersList />
    </SectionContainer>
  );
}
