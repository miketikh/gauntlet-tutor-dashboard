import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";
import type { StudentDetailProfile, StudentStats } from "@/services/student-service";
import type { StudentStatusType } from "@/lib/db/types";

interface StudentHeaderProps {
  student: StudentDetailProfile;
  stats: StudentStats;
  currentTutorName?: string | null;
}

/**
 * Get badge variant based on student status
 */
function getStatusBadgeVariant(
  status: StudentStatusType
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "active":
      return "default";
    case "churned":
      return "destructive";
    case "paused":
      return "secondary";
    default:
      return "outline";
  }
}

/**
 * Format status label for display
 */
function getStatusLabel(status: StudentStatusType): string {
  switch (status) {
    case "active":
      return "Active";
    case "churned":
      return "Churned";
    case "paused":
      return "Paused";
    default:
      return status;
  }
}

/**
 * Student Header Component
 *
 * Displays student identification, status, and quick stats at the top of the detail page.
 */
export function StudentHeader({ student, stats, currentTutorName }: StudentHeaderProps) {
  // Format student ID for display (anonymized)
  const studentDisplayId = `STU-${student.user_id.slice(-8).toUpperCase()}`;

  // Format enrolled since date
  const enrolledDate = new Date(student.enrolled_since).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Get subjects list
  const subjectNames = student.subjects.map(s => s.name).join(", ");

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          {/* Top Row: ID, Status, Contact */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-foreground">{studentDisplayId}</h1>
              <Badge variant={getStatusBadgeVariant(student.status)}>
                {getStatusLabel(student.status)}
              </Badge>
            </div>

            {student.parent_email && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.href = `mailto:${student.parent_email}`}
              >
                <Mail className="mr-2 h-4 w-4" />
                Contact Parent
              </Button>
            )}
          </div>

          {/* Enrolled Since */}
          <div className="text-sm text-muted-foreground">
            Enrolled since {enrolledDate}
          </div>

          {/* Quick Stats Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-border">
            <div>
              <div className="text-sm font-medium text-muted-foreground">Total Sessions</div>
              <div className="text-2xl font-bold text-foreground">{stats.sessions_completed}</div>
            </div>

            <div>
              <div className="text-sm font-medium text-muted-foreground">Current Tutor</div>
              <div className="text-lg font-semibold text-foreground">
                {currentTutorName || "No active tutor"}
              </div>
            </div>

            <div>
              <div className="text-sm font-medium text-muted-foreground">Subjects</div>
              <div className="text-sm text-foreground">
                {subjectNames || "None"}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
