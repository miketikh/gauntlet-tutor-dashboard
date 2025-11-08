import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAllStudents, getStudentStats, getStudentChurnRiskLevel } from "@/services/student-service";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Calendar, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import type { StudentStatusType } from "@/lib/db/types";

/**
 * Get badge variant for student status
 */
function getStatusBadgeVariant(
  status: StudentStatusType
): "default" | "secondary" | "destructive" {
  switch (status) {
    case "active":
      return "default";
    case "churned":
      return "destructive";
    case "paused":
      return "secondary";
    default:
      return "secondary";
  }
}

/**
 * Get badge variant for churn risk level
 */
function getRiskBadgeVariant(
  risk: 'low' | 'medium' | 'high'
): "default" | "secondary" | "destructive" {
  switch (risk) {
    case 'low':
      return "default";
    case 'medium':
      return "secondary";
    case 'high':
      return "destructive";
    default:
      return "secondary";
  }
}

/**
 * Format status label
 */
function formatStatusLabel(status: StudentStatusType): string {
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

export default async function StudentsListPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/sign-in");
  }

  // Fetch all students
  const students = await getAllStudents();

  // Fetch stats and churn risk for each student (in parallel)
  const studentsWithMetrics = await Promise.all(
    students.map(async (student) => {
      const [stats, churnRiskLevel] = await Promise.all([
        getStudentStats(student.user_id),
        getStudentChurnRiskLevel(student.user_id),
      ]);

      return {
        ...student,
        stats,
        churn_risk_level: churnRiskLevel,
      };
    })
  );

  // Sort by churn risk (high risk first) and then by enrolled date
  const sortedStudents = studentsWithMetrics.sort((a, b) => {
    // Prioritize high risk students
    const riskOrder = { high: 0, medium: 1, low: 2 };
    const riskDiff = riskOrder[a.churn_risk_level] - riskOrder[b.churn_risk_level];
    if (riskDiff !== 0) return riskDiff;

    // Then sort by enrolled date (newest first)
    return new Date(b.enrolled_since).getTime() - new Date(a.enrolled_since).getTime();
  });

  // Count at-risk students
  const atRiskCount = studentsWithMetrics.filter(
    s => s.churn_risk_level === 'medium' || s.churn_risk_level === 'high'
  ).length;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4 md:px-6">
          <PageHeader
            title="Students"
            description={`${students.length} students in the system`}
            breadcrumbs={[
              { label: "Dashboard", href: "/dashboard" },
              { label: "Students" },
            ]}
          />
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 md:px-6">
        {/* At-Risk Alert */}
        {atRiskCount > 0 && (
          <div className="mb-6 p-4 rounded-lg border border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950/20">
            <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-400">
              <AlertTriangle className="h-5 w-5" />
              <span className="font-semibold">
                {atRiskCount} student{atRiskCount !== 1 ? 's' : ''} at risk of churning
              </span>
            </div>
          </div>
        )}

        {/* Students Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {sortedStudents.map((student) => {
            const studentDisplayId = `STU-${student.user_id.slice(-8).toUpperCase()}`;

            return (
              <Link key={student.user_id} href={`/students/${student.user_id}`}>
                <Card className="h-full transition-all hover:shadow-md hover:border-primary/50 cursor-pointer">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-muted">
                          <User className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{studentDisplayId}</CardTitle>
                          <p className="text-xs text-muted-foreground">{student.email}</p>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {/* Status and Risk Badges */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant={getStatusBadgeVariant(student.status)}>
                          {formatStatusLabel(student.status)}
                        </Badge>
                        {student.status === 'active' && (
                          <Badge variant={getRiskBadgeVariant(student.churn_risk_level)}>
                            {student.churn_risk_level.toUpperCase()} RISK
                          </Badge>
                        )}
                      </div>

                      {/* Enrolled Since */}
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>
                          Enrolled {format(new Date(student.enrolled_since), "MMM yyyy")}
                        </span>
                      </div>

                      {/* Grade Level */}
                      {student.grade_level && (
                        <div className="text-xs text-muted-foreground">
                          Grade: {student.grade_level}
                        </div>
                      )}

                      {/* Stats */}
                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border">
                        <div>
                          <div className="text-xs text-muted-foreground">Sessions</div>
                          <div className="text-sm font-semibold text-foreground">
                            {student.stats.sessions_completed}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground">Avg Score</div>
                          <div className="text-sm font-semibold text-foreground">
                            {student.stats.avg_session_score !== null
                              ? student.stats.avg_session_score.toFixed(1)
                              : 'N/A'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        {/* Empty State */}
        {students.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/30 p-12 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <User className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-foreground">No students yet</h3>
            <p className="text-sm text-muted-foreground">
              Students will appear here once they are added to the system.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
