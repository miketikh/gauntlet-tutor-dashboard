"use client";

import { useDashboardStore } from '@/lib/stores/dashboard-store';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function SessionFeedFilters() {
  const { sessionFilter, setSessionFilter } = useDashboardStore();

  return (
    <div className="flex items-center gap-2">
      <Button
        variant={sessionFilter === 'all' ? 'default' : 'outline'}
        size="sm"
        onClick={() => setSessionFilter('all')}
        className={cn(sessionFilter === 'all' && 'bg-primary text-primary-foreground')}
      >
        All
      </Button>
      <Button
        variant={sessionFilter === 'flagged' ? 'default' : 'outline'}
        size="sm"
        onClick={() => setSessionFilter('flagged')}
        className={cn(sessionFilter === 'flagged' && 'bg-primary text-primary-foreground')}
      >
        Flagged Only
      </Button>
      <Button
        variant={sessionFilter === 'high_scoring' ? 'default' : 'outline'}
        size="sm"
        onClick={() => setSessionFilter('high_scoring')}
        className={cn(sessionFilter === 'high_scoring' && 'bg-primary text-primary-foreground')}
      >
        High Scoring Only
      </Button>
    </div>
  );
}
