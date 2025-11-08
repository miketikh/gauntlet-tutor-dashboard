"use client";

import { useState } from 'react';
import { LearningEventCard } from './learning-event-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { BookOpen } from 'lucide-react';
import type { LearningEvent } from '@/services/churn-service';

interface LearningEventsFeedProps {
  events: LearningEvent[];
  maxEvents?: number;
  onViewDetails?: (event: LearningEvent) => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
}

type FilterType = 'all' | 'correct' | 'incorrect' | 'has_survey';

export function LearningEventsFeed({
  events,
  maxEvents,
  onViewDetails,
  onLoadMore,
  hasMore = false,
}: LearningEventsFeedProps) {
  const [filter, setFilter] = useState<FilterType>('all');

  // Apply filter
  const filteredEvents = events.filter((event) => {
    switch (filter) {
      case 'correct':
        return event.was_prediction_correct;
      case 'incorrect':
        return !event.was_prediction_correct;
      case 'has_survey':
        return event.survey_response !== null && event.survey_response !== '';
      case 'all':
      default:
        return true;
    }
  });

  // Limit events if maxEvents is specified
  const displayedEvents = maxEvents
    ? filteredEvents.slice(0, maxEvents)
    : filteredEvents;

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Recent Learning Events</CardTitle>

          {/* Filter dropdown */}
          <Select value={filter} onValueChange={(value) => setFilter(value as FilterType)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter events" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Events</SelectItem>
              <SelectItem value="correct">Correct Predictions</SelectItem>
              <SelectItem value="incorrect">Incorrect Predictions</SelectItem>
              <SelectItem value="has_survey">Has Survey</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-y-auto">
        {/* Empty state */}
        {displayedEvents.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <BookOpen className="h-12 w-12 text-muted-foreground mb-3" />
            <h3 className="font-medium text-lg mb-1">No learning events yet</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              {filter === 'all'
                ? 'Learning events will appear here when the algorithm learns from churn cases. Create a case study from a churned student to generate insights.'
                : `No events match the "${filter}" filter. Try a different filter option.`}
            </p>
          </div>
        )}

        {/* Events list */}
        {displayedEvents.length > 0 && (
          <div className="space-y-3">
            {displayedEvents.map((event) => (
              <LearningEventCard
                key={event.id}
                event={event}
                onViewDetails={onViewDetails}
              />
            ))}
          </div>
        )}

        {/* Load more button */}
        {hasMore && onLoadMore && (
          <div className="mt-4 text-center">
            <Button variant="outline" size="sm" onClick={onLoadMore}>
              Load More Events
            </Button>
          </div>
        )}

        {/* Results count */}
        {displayedEvents.length > 0 && (
          <div className="mt-4 text-center text-xs text-muted-foreground">
            Showing {displayedEvents.length} of {filteredEvents.length} events
            {filter !== 'all' && ` (filtered: ${filter})`}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
