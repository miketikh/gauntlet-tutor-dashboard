'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';

interface ActionCenterFiltersProps {
  view: 'alerts' | 'insights';
}

export function ActionCenterFilters({ view }: ActionCenterFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentFilter = searchParams.get(view === 'alerts' ? 'severity' : 'type');

  const updateFilter = (filterValue: string | null) => {
    const params = new URLSearchParams(searchParams.toString());

    if (filterValue) {
      params.set(view === 'alerts' ? 'severity' : 'type', filterValue);
    } else {
      params.delete(view === 'alerts' ? 'severity' : 'type');
    }

    router.push(`${pathname}?${params.toString()}`);
  };

  const clearFilters = () => {
    router.push(pathname);
  };

  if (view === 'alerts') {
    return (
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm font-medium text-muted-foreground">Filter by severity:</span>
        <Button
          variant={currentFilter === 'critical' ? 'default' : 'outline'}
          size="sm"
          onClick={() => updateFilter(currentFilter === 'critical' ? null : 'critical')}
        >
          Critical
        </Button>
        <Button
          variant={currentFilter === 'warning' ? 'default' : 'outline'}
          size="sm"
          onClick={() => updateFilter(currentFilter === 'warning' ? null : 'warning')}
        >
          Warning
        </Button>
        <Button
          variant={currentFilter === 'info' ? 'default' : 'outline'}
          size="sm"
          onClick={() => updateFilter(currentFilter === 'info' ? null : 'info')}
        >
          Info
        </Button>
        {currentFilter && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="gap-1"
          >
            <X className="h-3 w-3" />
            Clear
          </Button>
        )}
      </div>
    );
  }

  // Insights filters
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-sm font-medium text-muted-foreground">Filter by type:</span>
      <Button
        variant={currentFilter === 'growth_area' ? 'default' : 'outline'}
        size="sm"
        onClick={() => updateFilter(currentFilter === 'growth_area' ? null : 'growth_area')}
      >
        Growth Areas
      </Button>
      <Button
        variant={currentFilter === 'strength' ? 'default' : 'outline'}
        size="sm"
        onClick={() => updateFilter(currentFilter === 'strength' ? null : 'strength')}
      >
        Strengths
      </Button>
      <Button
        variant={currentFilter === 'achievement' ? 'default' : 'outline'}
        size="sm"
        onClick={() => updateFilter(currentFilter === 'achievement' ? null : 'achievement')}
      >
        Achievements
      </Button>
      {currentFilter && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearFilters}
          className="gap-1"
        >
          <X className="h-3 w-3" />
          Clear
        </Button>
      )}
    </div>
  );
}
