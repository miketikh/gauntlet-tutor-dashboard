"use client";

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useDashboardStore } from '@/lib/stores/dashboard-store';
import { SessionCard, type SessionCardData } from '@/components/ui/session-card';
import { EmptyState } from '@/components/ui/empty-state';
import { FileX, Star } from 'lucide-react';
import type { RecentSession } from '@/services/dashboard';

interface SessionFeedListProps {
  sessions: RecentSession[];
}

export function SessionFeedList({ sessions }: SessionFeedListProps) {
  const router = useRouter();
  const { sessionFilter } = useDashboardStore();

  // Filter sessions based on active filter
  const filteredSessions = useMemo(() => {
    if (sessionFilter === 'all') {
      return sessions;
    }

    if (sessionFilter === 'flagged') {
      return sessions.filter((s) => s.is_flagged);
    }

    if (sessionFilter === 'high_scoring') {
      return sessions.filter((s) => s.overall_session_score !== null && s.overall_session_score >= 8.5);
    }

    return sessions;
  }, [sessions, sessionFilter]);

  // Handle empty states
  if (filteredSessions.length === 0) {
    if (sessionFilter === 'flagged') {
      return (
        <EmptyState
          icon={Star}
          title="No flagged sessions"
          description="Great news! No sessions are currently flagged for review."
          className="border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-950/50"
        />
      );
    }

    if (sessionFilter === 'high_scoring') {
      return (
        <EmptyState
          icon={FileX}
          title="No high-scoring sessions"
          description="No sessions with a score of 8.5 or higher were found."
        />
      );
    }

    return (
      <EmptyState
        icon={FileX}
        title="No sessions yet"
        description="Session data will appear here once completed sessions are analyzed."
      />
    );
  }

  // Convert to SessionCardData format
  const sessionCards: SessionCardData[] = filteredSessions.map((session) => {
    const flags: string[] = [];

    // Add flags based on session data
    if (session.is_flagged) {
      flags.push('⚠️ Flagged');
    }
    if (session.overall_session_score !== null && session.overall_session_score >= 8.5) {
      flags.push('⭐ High Score');
    }

    return {
      id: session.id,
      timestamp: session.scheduled_start,
      subject: session.subject_name,
      tutorName: session.tutor_name,
      overallScore: session.overall_session_score ?? undefined,
      engagementScore: session.student_engagement_score ?? undefined,
      flags: flags.length > 0 ? flags : undefined,
    };
  });

  return (
    <div className="space-y-3">
      {sessionCards.map((session) => (
        <SessionCard
          key={session.id}
          session={session}
          onClick={(sessionId) => router.push(`/sessions/${sessionId}`)}
        />
      ))}
    </div>
  );
}
