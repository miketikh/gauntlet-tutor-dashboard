'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle, ChevronRight } from "lucide-react";
import type { ChurnFactor, ChurnFactorCategoryType, RiskLevelType } from "@/lib/db/types";

export interface ChurnRiskAssessment {
  risk_score: number; // 0-1 scale
  risk_level: RiskLevelType;
  factors: ChurnFactor[];
}

interface ChurnRiskPanelProps {
  assessment: ChurnRiskAssessment;
  studentId: string;
}

/**
 * Convert factor category to human-readable text
 */
function formatFactorDescription(category: ChurnFactorCategoryType): string {
  const descriptions: Record<ChurnFactorCategoryType, string> = {
    first_session_satisfaction: 'First Session Experience',
    sessions_completed: 'Session History',
    follow_up_booking_rate: 'Follow-up Booking Rate',
    avg_session_score: 'Average Session Performance',
    tutor_consistency: 'Tutor Relationship Stability',
    student_engagement: 'Student Engagement Level',
    tutor_switch_frequency: 'Tutor Changes',
    scheduling_friction: 'Scheduling Reliability',
    response_rate: 'Communication Responsiveness',
  };
  return descriptions[category] || category;
}

/**
 * Get color classes for risk level
 */
function getRiskLevelColor(level: RiskLevelType): {
  bg: string;
  text: string;
  border: string;
  badge: "default" | "secondary" | "destructive" | "outline";
} {
  switch (level) {
    case 'low':
      return {
        bg: 'bg-green-50 dark:bg-green-950/20',
        text: 'text-green-700 dark:text-green-400',
        border: 'border-green-200 dark:border-green-800',
        badge: 'default',
      };
    case 'medium':
      return {
        bg: 'bg-yellow-50 dark:bg-yellow-950/20',
        text: 'text-yellow-700 dark:text-yellow-400',
        border: 'border-yellow-200 dark:border-yellow-800',
        badge: 'secondary',
      };
    case 'high':
      return {
        bg: 'bg-red-50 dark:bg-red-950/20',
        text: 'text-red-700 dark:text-red-400',
        border: 'border-red-200 dark:border-red-800',
        badge: 'destructive',
      };
    default:
      return {
        bg: 'bg-gray-50 dark:bg-gray-950/20',
        text: 'text-gray-700 dark:text-gray-400',
        border: 'border-gray-200 dark:border-gray-800',
        badge: 'outline',
      };
  }
}

/**
 * Churn Risk Panel Component
 *
 * Displays the student's churn risk assessment with risk and protective factors.
 * This is the most important component on the Student Detail Page.
 */
export function ChurnRiskPanel({ assessment, studentId }: ChurnRiskPanelProps) {
  const colors = getRiskLevelColor(assessment.risk_level);

  // Calculate risk percentage (0-100)
  const riskPercentage = Math.round(assessment.risk_score * 100);

  // Separate factors into risk (negative) and protective (positive)
  const riskFactors = assessment.factors
    .filter(f => {
      // Risk factors are those contributing significantly to risk
      if (f.impact === 'negative' && f.normalized_score > 0.5) return true;
      if (f.impact === 'positive' && f.normalized_score < 0.5) return true;
      return false;
    })
    .sort((a, b) => b.contribution_to_risk - a.contribution_to_risk)
    .slice(0, 5); // Top 5 risk factors

  const protectiveFactors = assessment.factors
    .filter(f => {
      // Protective factors are those reducing risk
      if (f.impact === 'positive' && f.normalized_score > 0.5) return true;
      if (f.impact === 'negative' && f.normalized_score < 0.5) return true;
      return false;
    })
    .sort((a, b) => a.contribution_to_risk - b.contribution_to_risk)
    .slice(0, 3); // Top 3 protective factors

  return (
    <Card className={`${colors.border} border-2`}>
      <CardHeader className={colors.bg}>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold">Churn Risk Assessment</CardTitle>
          <Badge variant={colors.badge} className="text-base px-3 py-1">
            {assessment.risk_level.toUpperCase()} RISK
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-6 space-y-6">
        {/* Risk Score Display */}
        <div className="text-center pb-4 border-b border-border">
          <div className="text-5xl font-bold mb-2" style={{ color: colors.text.split(' ')[0].replace('text-', '') }}>
            {riskPercentage}%
          </div>
          <div className="text-sm text-muted-foreground">
            Overall Churn Risk Score
          </div>
        </div>

        {/* Risk Factors Section */}
        {riskFactors.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <h3 className="font-semibold text-lg text-foreground">Risk Factors</h3>
            </div>
            <div className="space-y-3">
              {riskFactors.map((factor) => (
                <div
                  key={factor.category}
                  className="p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800"
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-medium text-sm text-foreground">
                      {formatFactorDescription(factor.category)}
                    </span>
                    <Badge variant="destructive" className="text-xs">
                      {Math.round(factor.weight * 100)}% weight
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Value: {typeof factor.value === 'number' ? factor.value.toFixed(1) : factor.value}
                  </div>
                  <div className="text-xs text-red-600 dark:text-red-400 mt-1">
                    Contributes {Math.round(factor.contribution_to_risk * 100)}% to overall risk
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Protective Factors Section */}
        {protectiveFactors.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <h3 className="font-semibold text-lg text-foreground">Protective Factors</h3>
            </div>
            <div className="space-y-3">
              {protectiveFactors.map((factor) => (
                <div
                  key={factor.category}
                  className="p-3 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800"
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-medium text-sm text-foreground">
                      {formatFactorDescription(factor.category)}
                    </span>
                    <Badge variant="default" className="text-xs bg-green-600">
                      {Math.round(factor.weight * 100)}% weight
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Value: {typeof factor.value === 'number' ? factor.value.toFixed(1) : factor.value}
                  </div>
                  <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                    Reduces risk by {Math.round((1 - factor.contribution_to_risk) * factor.weight * 100)}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Link */}
        <div className="pt-4 border-t border-border">
          <Button variant="outline" className="w-full" asChild>
            <a href={`/dashboard/students/${studentId}/risk-analysis`}>
              View detailed risk analysis
              <ChevronRight className="ml-2 h-4 w-4" />
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
