import { getDashboardTopPerformers } from '@/services/dashboard';
import { ScoreBadge } from '@/components/ui/score-badge';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { Trophy } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export async function TopPerformersList() {
  const performers = await getDashboardTopPerformers(3);

  if (performers.length === 0) {
    return (
      <EmptyState
        icon={Trophy}
        title="No performers yet"
        description="Performance data will appear here once sessions are completed."
      />
    );
  }

  return (
    <div className="space-y-2">
      {performers.map((performer, index) => {
        const rank = index + 1;

        // Determine rank badge color
        let rankBadgeClass = '';
        if (rank === 1) {
          rankBadgeClass = 'bg-yellow-500 text-white hover:bg-yellow-600';
        } else if (rank === 2) {
          rankBadgeClass = 'bg-gray-400 text-white hover:bg-gray-500';
        } else if (rank === 3) {
          rankBadgeClass = 'bg-amber-700 text-white hover:bg-amber-800';
        }

        return (
          <Link
            key={performer.user_id}
            href={`/dashboard/tutors/${performer.user_id}`}
            className="block"
          >
            <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-3 transition-colors hover:bg-accent">
              <Badge className={cn('min-w-[2rem] justify-center', rankBadgeClass)}>
                {rank}
              </Badge>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground truncate">
                  {performer.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {performer.session_count} sessions
                </p>
              </div>
              <ScoreBadge score={performer.overall_score} size="sm" />
            </div>
          </Link>
        );
      })}
    </div>
  );
}
