import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Calendar, Award, TrendingUp } from "lucide-react";
import type { StudentTutorHistory } from "@/services/tutor-service";

interface TutorHistoryListProps {
  tutorHistory: StudentTutorHistory[];
  currentTutorId: string | null;
}

/**
 * Format date range for display
 */
function formatDateRange(firstDate: Date, lastDate: Date): string {
  const first = new Date(firstDate);
  const last = new Date(lastDate);

  const firstMonth = first.toLocaleDateString("en-US", { month: "short", year: "numeric" });

  // Check if last session was within the last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  if (last > thirtyDaysAgo) {
    return `${firstMonth} - Present`;
  }

  const lastMonth = last.toLocaleDateString("en-US", { month: "short", year: "numeric" });

  if (firstMonth === lastMonth) {
    return firstMonth;
  }

  return `${firstMonth} - ${lastMonth}`;
}

/**
 * Get performance indicator icon and color based on score
 */
function getTutorPerformanceIndicator(avgScore: number | null): {
  label: string;
  color: string;
  icon: typeof Award;
} {
  if (avgScore === null) {
    return {
      label: 'No Data',
      color: 'text-gray-500',
      icon: Award,
    };
  }

  if (avgScore >= 8) {
    return {
      label: 'Great',
      color: 'text-green-600 dark:text-green-400',
      icon: Award,
    };
  }

  if (avgScore >= 7) {
    return {
      label: 'Good',
      color: 'text-blue-600 dark:text-blue-400',
      icon: TrendingUp,
    };
  }

  return {
    label: 'Needs Work',
    color: 'text-yellow-600 dark:text-yellow-400',
    icon: TrendingUp,
  };
}

/**
 * Tutor History List Component
 *
 * Displays all tutors a student has worked with, chronologically ordered.
 */
export function TutorHistoryList({ tutorHistory, currentTutorId }: TutorHistoryListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Tutor History</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {tutorHistory.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            No tutor history available
          </div>
        ) : (
          tutorHistory.map((tutor) => {
            const isCurrent = tutor.tutor_id === currentTutorId;
            const performance = getTutorPerformanceIndicator(tutor.avg_session_score);
            const PerformanceIcon = performance.icon;

            return (
              <Card
                key={tutor.tutor_id}
                className={isCurrent ? 'border-2 border-blue-500 dark:border-blue-400' : ''}
              >
                <CardContent className="pt-4 space-y-3">
                  {/* Tutor Name and Current Badge */}
                  <div className="flex items-center justify-between">
                    <Link
                      href={`/dashboard/tutors/${tutor.tutor_id}`}
                      className="text-lg font-semibold text-blue-600 hover:underline dark:text-blue-400"
                    >
                      {tutor.tutor_name}
                    </Link>
                    {isCurrent && (
                      <Badge variant="default">Current</Badge>
                    )}
                  </div>

                  {/* Date Range */}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>{formatDateRange(tutor.first_session_date, tutor.last_session_date)}</span>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div>
                      <div className="text-xs text-muted-foreground">Sessions Together</div>
                      <div className="text-lg font-bold text-foreground">
                        {tutor.sessions_together}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs text-muted-foreground">Avg Score</div>
                      <div className="flex items-center gap-1">
                        <span className="text-lg font-bold text-foreground">
                          {tutor.avg_session_score !== null
                            ? tutor.avg_session_score.toFixed(1)
                            : 'N/A'}
                        </span>
                        {tutor.avg_session_score !== null && (
                          <PerformanceIcon className={`h-4 w-4 ${performance.color}`} />
                        )}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs text-muted-foreground">Satisfaction</div>
                      <div className="text-lg font-bold text-foreground">
                        {tutor.avg_satisfaction_rating !== null
                          ? `${tutor.avg_satisfaction_rating.toFixed(1)} ★`
                          : 'N/A'}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs text-muted-foreground">Rebook Rate</div>
                      <div className="text-lg font-bold text-foreground">
                        {tutor.rebook_rate !== null
                          ? `${tutor.rebook_rate.toFixed(0)}%`
                          : 'N/A'}
                      </div>
                    </div>
                  </div>

                  {/* Performance Indicator */}
                  {tutor.avg_session_score !== null && (
                    <div className={`text-xs ${performance.color} font-medium pt-1`}>
                      Performance: {performance.label}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
