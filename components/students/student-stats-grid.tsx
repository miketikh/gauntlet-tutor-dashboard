import { MetricCard } from "@/components/ui/metric-card";
import { BookOpen, Target, Activity, Users, Repeat, Star } from "lucide-react";
import type { StudentStats } from "@/services/student-service";

interface StudentStatsGridProps {
  stats: StudentStats;
}

/**
 * Format stat value based on type
 */
function formatStatValue(value: number | null, type: 'count' | 'score' | 'percentage' | 'rating'): string {
  if (value === null) {
    return 'N/A';
  }

  switch (type) {
    case 'count':
      return value.toString();
    case 'score':
      return value.toFixed(1);
    case 'percentage':
      return `${value.toFixed(1)}%`;
    case 'rating':
      return value.toFixed(1);
    default:
      return value.toString();
  }
}

/**
 * Get variant based on score thresholds
 */
function getScoreVariant(score: number | null): "default" | "success" | "warning" | "danger" {
  if (score === null) return 'default';
  if (score >= 7) return 'success';
  if (score >= 5) return 'warning';
  return 'danger';
}

/**
 * Student Stats Grid Component
 *
 * Displays 6 key metrics for student performance in a responsive grid.
 */
export function StudentStatsGrid({ stats }: StudentStatsGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {/* Sessions Completed */}
      <MetricCard
        title="Sessions Completed"
        value={formatStatValue(stats.sessions_completed, 'count')}
        icon={BookOpen}
        variant="default"
      />

      {/* Average Session Score */}
      <MetricCard
        title="Avg Session Score"
        value={formatStatValue(stats.avg_session_score, 'score')}
        icon={Target}
        variant={getScoreVariant(stats.avg_session_score)}
        description={stats.avg_session_score !== null ? "Out of 10" : undefined}
      />

      {/* Average Student Engagement */}
      <MetricCard
        title="Avg Student Engagement"
        value={formatStatValue(stats.avg_engagement, 'score')}
        icon={Activity}
        variant={getScoreVariant(stats.avg_engagement)}
        description={stats.avg_engagement !== null ? "Out of 10" : undefined}
      />

      {/* Tutors Worked With */}
      <MetricCard
        title="Tutors Worked With"
        value={formatStatValue(stats.tutors_worked_with, 'count')}
        icon={Users}
        variant="default"
      />

      {/* Rebook Rate */}
      <MetricCard
        title="Rebook Rate"
        value={formatStatValue(stats.rebook_rate, 'percentage')}
        icon={Repeat}
        variant={stats.rebook_rate !== null && stats.rebook_rate >= 70 ? 'success' : 'default'}
        description={stats.rebook_rate !== null ? "Follow-up sessions" : undefined}
      />

      {/* Average Satisfaction Rating */}
      <MetricCard
        title="Avg Satisfaction Rating"
        value={formatStatValue(stats.avg_satisfaction_rating, 'rating')}
        icon={Star}
        variant={getScoreVariant(stats.avg_satisfaction_rating ? stats.avg_satisfaction_rating * 2 : null)}
        description={stats.avg_satisfaction_rating !== null ? "Out of 5 stars" : undefined}
      />
    </div>
  );
}
