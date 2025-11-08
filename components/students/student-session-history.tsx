'use client';

import { useMemo } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { ArrowRightLeft } from "lucide-react";
import Link from "next/link";
import type { StudentSessionHistoryItem, TutorSwitch } from "@/services/session-service";
import type { SessionStatusType } from "@/lib/db/types";

interface StudentSessionHistoryProps {
  sessions: StudentSessionHistoryItem[];
  tutorSwitches: TutorSwitch[];
}

/**
 * Format date for display
 */
function formatSessionDate(date: Date): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Get badge variant for session status
 */
function getStatusBadgeVariant(
  status: SessionStatusType
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case 'completed':
      return 'default';
    case 'no_show_student':
    case 'no_show_tutor':
      return 'destructive';
    case 'cancelled':
      return 'secondary';
    case 'rescheduled':
      return 'outline';
    default:
      return 'outline';
  }
}

/**
 * Get badge variant for score
 */
function getScoreBadgeVariant(score: string | null): "default" | "secondary" | "destructive" {
  if (!score) return 'secondary';
  const numScore = parseFloat(score);
  if (numScore >= 7) return 'default';
  if (numScore >= 5) return 'secondary';
  return 'destructive';
}

/**
 * Format status label
 */
function formatStatusLabel(status: SessionStatusType): string {
  switch (status) {
    case 'completed':
      return 'Completed';
    case 'no_show_student':
      return 'No Show (Student)';
    case 'no_show_tutor':
      return 'No Show (Tutor)';
    case 'cancelled':
      return 'Cancelled';
    case 'rescheduled':
      return 'Rescheduled';
    case 'scheduled':
      return 'Scheduled';
    case 'in_progress':
      return 'In Progress';
    default:
      return status;
  }
}

/**
 * Check if session is a tutor switch
 */
function isTutorSwitchSession(sessionId: string, tutorSwitches: TutorSwitch[]): boolean {
  return tutorSwitches.some(s => s.session_id === sessionId);
}

/**
 * Student Session History Component
 *
 * Displays a table of all sessions for a student with tutor information and metrics.
 */
export function StudentSessionHistory({ sessions, tutorSwitches }: StudentSessionHistoryProps) {
  const columns = useMemo<ColumnDef<StudentSessionHistoryItem>[]>(
    () => [
      {
        accessorKey: "scheduled_start",
        header: "Date",
        cell: ({ row }) => formatSessionDate(row.original.scheduled_start),
        enableSorting: true,
      },
      {
        accessorKey: "tutor_name",
        header: "Tutor",
        cell: ({ row }) => {
          const isSwitchSession = isTutorSwitchSession(row.original.id, tutorSwitches);
          return (
            <div className="flex items-center gap-2">
              <Link
                href={`/tutors/${row.original.tutor_id}`}
                className="text-blue-600 hover:underline dark:text-blue-400"
              >
                {row.original.tutor_name}
              </Link>
              {isSwitchSession && (
                <ArrowRightLeft className="h-4 w-4 text-yellow-500" />
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "subject_name",
        header: "Subject",
      },
      {
        accessorKey: "session_number",
        header: "Session #",
        cell: ({ row }) => `#${row.original.session_number}`,
      },
      {
        accessorKey: "overall_session_score",
        header: "Score",
        cell: ({ row }) => {
          const score = row.original.overall_session_score;
          if (!score) {
            return <span className="text-muted-foreground">N/A</span>;
          }
          return (
            <Badge variant={getScoreBadgeVariant(score)}>
              {parseFloat(score).toFixed(1)}
            </Badge>
          );
        },
        enableSorting: true,
      },
      {
        accessorKey: "student_satisfaction_rating",
        header: "Rating",
        cell: ({ row }) => {
          const rating = row.original.student_satisfaction_rating;
          if (rating === null) {
            return <span className="text-muted-foreground">N/A</span>;
          }
          return (
            <div className="flex items-center gap-1">
              <span className="text-yellow-500">★</span>
              <span>{rating.toFixed(1)}</span>
            </div>
          );
        },
        enableSorting: true,
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <Badge variant={getStatusBadgeVariant(row.original.status)}>
            {formatStatusLabel(row.original.status)}
          </Badge>
        ),
      },
    ],
    [tutorSwitches]
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-foreground">Session History</h2>
        <div className="text-sm text-muted-foreground">
          {sessions.length} session{sessions.length !== 1 ? 's' : ''}
        </div>
      </div>

      <DataTable
        columns={columns}
        data={sessions}
        onRowClick={(row) => {
          window.location.href = `/sessions/${row.id}`;
        }}
        sortable={true}
      />

      {tutorSwitches.length > 0 && (
        <div className="text-xs text-muted-foreground flex items-center gap-2">
          <ArrowRightLeft className="h-3 w-3 text-yellow-500" />
          <span>
            Sessions with <ArrowRightLeft className="inline h-3 w-3" /> indicate a tutor switch
          </span>
        </div>
      )}
    </div>
  );
}
