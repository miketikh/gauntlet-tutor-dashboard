import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertCircle, ExternalLink } from "lucide-react";
import type { StudentDetailProfile } from "@/services/student-service";
import type { ChurnReasonType } from "@/lib/db/types";

interface ChurnManagementPanelProps {
  student: StudentDetailProfile;
  churnReasons: ChurnReasonType[];
}

/**
 * Convert churn reason enum to human-readable label
 */
function getChurnReasonLabel(reason: ChurnReasonType): string {
  const labels: Record<ChurnReasonType, string> = {
    poor_first_session: 'Poor First Session',
    tutor_mismatch: 'Tutor Mismatch',
    no_progress: 'No Progress',
    scheduling_difficulty: 'Scheduling Difficulty',
    price_concerns: 'Price Concerns',
    technical_issues: 'Technical Issues',
    found_competitor: 'Found Competitor',
    completed_goals: 'Completed Goals',
    personal_circumstances: 'Personal Circumstances',
    other: 'Other',
  };
  return labels[reason] || reason;
}

/**
 * Get badge variant based on reason severity
 */
function getChurnReasonColor(
  reason: ChurnReasonType
): "default" | "secondary" | "destructive" | "outline" {
  // Critical issues that could have been prevented
  if (reason === 'poor_first_session' || reason === 'tutor_mismatch') {
    return 'destructive';
  }

  // External factors (not our fault)
  if (reason === 'completed_goals' || reason === 'personal_circumstances') {
    return 'secondary';
  }

  // Issues we can improve
  if (
    reason === 'no_progress' ||
    reason === 'scheduling_difficulty' ||
    reason === 'technical_issues'
  ) {
    return 'outline';
  }

  return 'default';
}

/**
 * Churn Management Panel Component
 *
 * Displays post-churn analysis for churned students only.
 * Includes churn date, reasons, survey response, and algorithm learning link.
 */
export function ChurnManagementPanel({ student, churnReasons }: ChurnManagementPanelProps) {
  // Only render if student is churned
  if (student.status !== 'churned') {
    return null;
  }

  // Format churn date
  const churnDate = student.churned_date
    ? new Date(student.churned_date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : 'Unknown';

  return (
    <Card className="border-red-200 dark:border-red-800 bg-red-50/30 dark:bg-red-950/10">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-red-500" />
          <CardTitle className="text-lg">Churn Management</CardTitle>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Churn Date */}
        <div>
          <div className="text-sm font-medium text-muted-foreground mb-1">Churn Date</div>
          <div className="text-base text-foreground">{churnDate}</div>
        </div>

        {/* Recorded Reasons */}
        <div>
          <div className="text-sm font-medium text-muted-foreground mb-2">Recorded Reasons</div>
          {churnReasons.length === 0 ? (
            <div className="text-sm text-muted-foreground">No reasons recorded</div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {churnReasons.map((reason) => (
                <Badge key={reason} variant={getChurnReasonColor(reason)}>
                  {getChurnReasonLabel(reason)}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Survey Response */}
        <div>
          <div className="text-sm font-medium text-muted-foreground mb-2">Survey Response</div>
          {student.churn_survey_response ? (
            <blockquote className="border-l-4 border-muted-foreground pl-4 italic text-sm text-muted-foreground">
              {student.churn_survey_response}
            </blockquote>
          ) : (
            <div className="text-sm text-muted-foreground">No survey response</div>
          )}
        </div>

        {/* Algorithm Learning Event */}
        <div className="pt-2 border-t border-border">
          <Button variant="outline" className="w-full text-sm" asChild>
            <a href="/settings/algorithm" className="flex items-center justify-center gap-2">
              <span>This churn case was used to refine the prediction algorithm</span>
              <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
        </div>

        {/* Additional Note */}
        <div className="text-xs text-muted-foreground pt-2">
          Post-mortem analysis helps improve churn prediction for future students.
        </div>
      </CardContent>
    </Card>
  );
}
