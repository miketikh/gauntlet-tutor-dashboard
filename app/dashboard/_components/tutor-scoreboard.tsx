import { TwoColumnLayout } from '@/components/ui/two-column-layout';
import { SectionContainer } from '@/components/ui/section-container';
import { TopPerformersList } from './top-performers-list';
import { TutorsNeedingAttention } from './tutors-needing-attention';

export function TutorScoreboard() {
  return (
    <TwoColumnLayout
      leftWidth="2/3"
      leftColumn={
        <SectionContainer variant="card" title="Top Performers 🌟">
          <TopPerformersList />
        </SectionContainer>
      }
      rightColumn={
        <SectionContainer variant="card" title="Needs Attention ⚠️">
          <TutorsNeedingAttention />
        </SectionContainer>
      }
    />
  );
}
