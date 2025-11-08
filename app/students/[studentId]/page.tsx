import { Suspense } from "react";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { LoadingCard } from "@/components/ui/loading-card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

// Import service functions
import { getStudentDetailById, getStudentStats, getStudentChurnReasons } from "@/services/student-service";
import { getStudentSessionHistory, getStudentTutorSwitches } from "@/services/session-service";
import { getStudentTutorHistory, getStudentCurrentTutor } from "@/services/tutor-service";

// Import components
import { StudentHeader } from "@/components/students/student-header";
import { ChurnRiskPanel, type ChurnRiskAssessment } from "@/components/students/churn-risk-panel";
import { StudentStatsGrid } from "@/components/students/student-stats-grid";
import { StudentSessionHistory } from "@/components/students/student-session-history";
import { TutorHistoryList } from "@/components/students/tutor-history-list";
import { ChurnManagementPanel } from "@/components/students/churn-management-panel";

// Import types
import type { ChurnFactor, RiskLevelType } from "@/lib/db/types";

interface StudentDetailPageProps {
  params: Promise<{
    studentId: string;
  }>;
}

/**
 * Calculate churn risk assessment from student data
 * This is a simplified version - in a full implementation, this would use
 * the churn service functions from student-service.ts
 */
async function getChurnRiskAssessment(studentId: string): Promise<ChurnRiskAssessment> {
  // Import the churn calculation functions
  const { getChurnAlgorithmWeights, calculateChurnFactor } = await import('@/services/student-service');

  try {
    const weights = await getChurnAlgorithmWeights();

    // Calculate all factors
    const factorPromises = Object.entries(weights).map(([category, weight]) =>
      calculateChurnFactor(studentId, category as any, weight)
    );

    const factors = await Promise.all(factorPromises);

    // Calculate total risk score (0-1 scale)
    const totalRisk = factors.reduce((sum, factor) => sum + factor.contribution_to_risk, 0);

    // Determine risk level
    let risk_level: RiskLevelType = 'low';
    if (totalRisk >= 0.6) {
      risk_level = 'high';
    } else if (totalRisk >= 0.3) {
      risk_level = 'medium';
    }

    return {
      risk_score: totalRisk,
      risk_level,
      factors,
    };
  } catch (error) {
    console.error('Error calculating churn risk:', error);
    // Return default low risk if calculation fails
    return {
      risk_score: 0,
      risk_level: 'low',
      factors: [],
    };
  }
}

export default async function StudentDetailPage({ params }: StudentDetailPageProps) {
  // Await params in Next.js 15
  const { studentId } = await params;

  // Fetch all required data in parallel
  const [
    student,
    stats,
    churnRiskAssessment,
    sessionHistory,
    tutorSwitches,
    tutorHistory,
    currentTutor,
    churnReasons,
  ] = await Promise.all([
    getStudentDetailById(studentId),
    getStudentStats(studentId),
    getChurnRiskAssessment(studentId),
    getStudentSessionHistory(studentId, { limit: 50 }),
    getStudentTutorSwitches(studentId),
    getStudentTutorHistory(studentId),
    getStudentCurrentTutor(studentId),
    getStudentChurnReasons(studentId),
  ]);

  // Handle student not found
  if (!student) {
    notFound();
  }

  return (
    <>
      {/* Page Header with Back Button */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/students">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Students
          </Button>
        </Link>
        <PageHeader
          title="Student Details"
          description="View student performance and churn risk analysis"
        />
      </div>

      <div className="space-y-6">
        {/* Student Header */}
        <StudentHeader
          student={student}
          stats={stats}
          currentTutorName={currentTutor?.tutor_name || null}
        />

        {/* Two-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column (2/3 width) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Churn Risk Panel (Prominent) */}
            <ChurnRiskPanel
              assessment={churnRiskAssessment}
              studentId={studentId}
            />

            {/* Student Stats Grid */}
            <StudentStatsGrid stats={stats} />

            {/* Session History */}
            <StudentSessionHistory
              sessions={sessionHistory}
              tutorSwitches={tutorSwitches}
            />
          </div>

          {/* Right Column (1/3 width) */}
          <div className="space-y-6">
            {/* Tutor History */}
            <TutorHistoryList
              tutorHistory={tutorHistory}
              currentTutorId={currentTutor?.tutor_id || null}
            />

            {/* Churn Management (only if churned) */}
            {student.status === 'churned' && (
              <ChurnManagementPanel
                student={student}
                churnReasons={churnReasons}
              />
            )}
          </div>
        </div>
      </div>
    </>
  );
}

/**
 * Generate metadata for the page
 */
export async function generateMetadata({ params }: StudentDetailPageProps) {
  const { studentId } = await params;
  const student = await getStudentDetailById(studentId);

  if (!student) {
    return {
      title: 'Student Not Found | Tutor Dashboard',
    };
  }

  const studentDisplayId = `STU-${studentId.slice(-8).toUpperCase()}`;

  return {
    title: `${studentDisplayId} | Tutor Dashboard`,
    description: 'View student performance and churn risk analysis',
  };
}
