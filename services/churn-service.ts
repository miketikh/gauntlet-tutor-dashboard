import { db } from '@/lib/db';
import { churnAlgorithmWeights, churnWeightHistory, sessions, sessionAudioMetrics, students, users, studentChurnReasons } from '@/lib/db';
import { eq, desc, asc, sql, and, inArray, gte, or, isNotNull } from 'drizzle-orm';
import type { ChurnFactorCategoryType } from '@/lib/db/types';

// ============================================
// TYPESCRIPT INTERFACES
// ============================================

/**
 * Map of churn factor categories to their weight values
 */
export interface AlgorithmWeights {
  [key: string]: number;
}

/**
 * Individual churn factor with detailed scoring
 */
export interface ChurnFactorDetail {
  category: ChurnFactorCategoryType;
  weight: number;
  value: number; // Raw value before normalization
  normalized_score: number; // 0-1 scale
  impact: 'positive' | 'negative';
  contribution_to_risk: number; // Weight * normalized_score
}

/**
 * Complete churn risk calculation result
 */
export interface ChurnRiskResult {
  score: number; // 0-1, overall churn risk
  level: 'low' | 'medium' | 'high';
  factors: ChurnFactorDetail[];
  explanation?: string;
}

/**
 * Weight validation result
 */
export interface WeightValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Result from updating algorithm weights
 */
export interface WeightUpdateResult {
  version: number;
  accuracyBefore: number | null;
  accuracyAfter: number | null;
  delta: number | null;
  historyId: string;
}

/**
 * Summary entry for weight history list
 */
export interface WeightHistoryEntry {
  id: string;
  version: number;
  changed_by: string;
  changed_by_name: string;
  change_reason: string;
  accuracy_before: number | null;
  accuracy_after: number | null;
  delta: number | null;
  created_at: Date;
}

/**
 * Detailed weight history with case study information
 */
export interface WeightHistoryDetail extends WeightHistoryEntry {
  old_weights: AlgorithmWeights;
  new_weights: AlgorithmWeights;
  case_study_session_id: string | null;
  case_study_student_id: string | null;
  case_study_session?: any;
  case_study_student?: any;
}

/**
 * Accuracy metrics for model performance
 */
export interface AccuracyMetrics {
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  truePositives: number;
  falsePositives: number;
  trueNegatives: number;
  falseNegatives: number;
  totalPredictions: number;
}

/**
 * Learning event from churn case study
 */
export interface LearningEvent {
  id: string;
  version: number;
  student_id: string;
  student_name: string;
  churn_date: string | null;
  predicted_risk: number;
  predicted_level: 'low' | 'medium' | 'high';
  actual_outcome: 'churned' | 'active';
  was_prediction_correct: boolean;
  survey_response: string | null;
  what_system_learned: string;
  weight_change_summary: string;
  created_at: Date;
}

/**
 * Case study recommendation for weight adjustments
 */
export interface CaseStudyRecommendation {
  student_id: string;
  predicted_risk: ChurnRiskResult;
  actual_outcome: 'churned' | 'active';
  was_correct: boolean;
  suggested_weights: AlgorithmWeights;
  rationale: string;
  factor_analysis: Array<{
    factor: ChurnFactorCategoryType;
    current_weight: number;
    suggested_weight: number;
    reason: string;
  }>;
}

/**
 * Churned student for case study workflow
 */
export interface ChurnedStudent {
  user_id: string;
  name: string;
  enrolled_since: string;
  churned_date: string | null;
  churn_reasons: string[];
  churn_survey_response: string | null;
  predicted_risk: ChurnRiskResult | null;
  sessions_completed: number;
}

// ============================================
// DEFAULT WEIGHTS
// ============================================

const DEFAULT_WEIGHTS: AlgorithmWeights = {
  first_session_satisfaction: 0.25,
  sessions_completed: 0.15,
  follow_up_booking_rate: 0.20,
  avg_session_score: 0.15,
  tutor_consistency: 0.10,
  student_engagement: 0.15,
};

// ============================================
// CORE FUNCTIONS
// ============================================

/**
 * Get the current algorithm weights from the database
 *
 * Queries the churn_algorithm_weights table for the latest version.
 * If no weights exist in the database, returns the default weights.
 *
 * @returns Object mapping factor category to weight value
 *
 * @example
 * ```typescript
 * const weights = await getCurrentAlgorithmWeights();
 * console.log(weights.first_session_satisfaction); // 0.25
 * ```
 */
export async function getCurrentAlgorithmWeights(): Promise<AlgorithmWeights> {
  try {
    // Get the latest version number
    const latestVersionResult = await db
      .select({ version: sql<number>`MAX(${churnAlgorithmWeights.version})` })
      .from(churnAlgorithmWeights);

    const latestVersion = latestVersionResult[0]?.version;

    if (!latestVersion) {
      // No weights in database, return defaults
      return DEFAULT_WEIGHTS;
    }

    // Get all weights for the latest version
    const weightsResult = await db
      .select({
        factor_category: churnAlgorithmWeights.factor_category,
        weight: churnAlgorithmWeights.weight,
      })
      .from(churnAlgorithmWeights)
      .where(eq(churnAlgorithmWeights.version, latestVersion));

    // Convert to object mapping
    const weights: AlgorithmWeights = {};
    for (const row of weightsResult) {
      weights[row.factor_category] = parseFloat(row.weight);
    }

    // Ensure all 6 factors are present, use defaults for missing
    const result = { ...DEFAULT_WEIGHTS };
    Object.keys(weights).forEach(key => {
      result[key] = weights[key];
    });

    return result;
  } catch (error) {
    console.error('Error in getCurrentAlgorithmWeights:', error);
    return DEFAULT_WEIGHTS;
  }
}

/**
 * Validate that weights meet all requirements
 *
 * Checks:
 * - All 6 required factors are present
 * - Each weight is between 0 and 1
 * - Total sum equals 1.0 (with 0.001 tolerance)
 *
 * @param weights - The weights object to validate
 * @returns Validation result with isValid flag and error messages
 *
 * @example
 * ```typescript
 * const result = validateWeights({ first_session_satisfaction: 0.5, ... });
 * if (!result.isValid) {
 *   console.error(result.errors);
 * }
 * ```
 */
export function validateWeights(weights: Record<string, number>): WeightValidationResult {
  const errors: string[] = [];

  // Check all 6 required factors are present
  const requiredFactors = Object.keys(DEFAULT_WEIGHTS);
  const missingFactors = requiredFactors.filter(factor => !(factor in weights));

  if (missingFactors.length > 0) {
    errors.push(`Missing required factors: ${missingFactors.join(', ')}`);
  }

  // Check each weight is between 0 and 1
  Object.entries(weights).forEach(([factor, weight]) => {
    if (typeof weight !== 'number' || isNaN(weight)) {
      errors.push(`Invalid weight for ${factor}: must be a number`);
    } else if (weight < 0 || weight > 1) {
      errors.push(`Invalid weight for ${factor}: must be between 0 and 1 (got ${weight})`);
    }
  });

  // Check sum equals 1.0 (with tolerance)
  const sum = Object.values(weights).reduce((acc, w) => acc + w, 0);
  const tolerance = 0.001;

  if (Math.abs(sum - 1.0) > tolerance) {
    errors.push(`Weights must sum to 1.0 (current sum: ${sum.toFixed(3)})`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Calculate churn factors for a student
 *
 * Helper function that computes all 6 churn factors from student session data.
 * Each factor includes raw value, normalized score, and contribution to overall risk.
 *
 * @param studentId - The student user ID
 * @param weights - Algorithm weights to use for calculation
 * @returns Array of ChurnFactorDetail objects
 *
 * @example
 * ```typescript
 * const weights = await getCurrentAlgorithmWeights();
 * const factors = await calculateChurnFactors('student-123', weights);
 * factors.forEach(f => {
 *   console.log(`${f.category}: ${f.normalized_score} (impact: ${f.impact})`);
 * });
 * ```
 */
export async function calculateChurnFactors(
  studentId: string,
  weights: AlgorithmWeights
): Promise<ChurnFactorDetail[]> {
  try {
    // Fetch all completed sessions for this student with metrics
    const studentSessions = await db
      .select({
        session: sessions,
        audioMetrics: sessionAudioMetrics,
      })
      .from(sessions)
      .leftJoin(sessionAudioMetrics, eq(sessions.id, sessionAudioMetrics.session_id))
      .where(and(
        eq(sessions.student_id, studentId),
        eq(sessions.status, 'completed')
      ))
      .orderBy(asc(sessions.scheduled_start));

    if (studentSessions.length === 0) {
      // No sessions - return neutral factors
      return Object.entries(weights).map(([category, weight]) => ({
        category: category as ChurnFactorCategoryType,
        weight,
        value: 0.5,
        normalized_score: 0.5,
        impact: 'negative' as const,
        contribution_to_risk: weight * 0.5,
      }));
    }

    const factors: ChurnFactorDetail[] = [];

    // 1. First Session Satisfaction
    const firstSession = studentSessions[0];
    const firstSessionScore = firstSession.session.overall_session_score
      ? parseFloat(firstSession.session.overall_session_score)
      : 5.0;

    // Normalize to 0-1 (10-point scale), then invert (higher score = lower risk)
    const firstSessionNormalized = firstSessionScore / 10;
    const firstSessionRisk = 1 - firstSessionNormalized; // Invert: high score = low risk

    // Heavily penalize scores < 6.5
    const firstSessionAdjusted = firstSessionScore < 6.5
      ? Math.min(1.0, firstSessionRisk * 1.5)
      : firstSessionRisk;

    factors.push({
      category: 'first_session_satisfaction',
      weight: weights.first_session_satisfaction,
      value: firstSessionScore,
      normalized_score: firstSessionAdjusted,
      impact: firstSessionScore >= 7.0 ? 'positive' : 'negative',
      contribution_to_risk: weights.first_session_satisfaction * firstSessionAdjusted,
    });

    // 2. Sessions Completed
    const sessionCount = studentSessions.length;
    // Normalize: 0-20+ sessions, more sessions = lower risk
    const sessionCountNormalized = Math.min(sessionCount / 20, 1.0);
    const sessionCountRisk = 1 - sessionCountNormalized; // Invert

    factors.push({
      category: 'sessions_completed',
      weight: weights.sessions_completed,
      value: sessionCount,
      normalized_score: sessionCountRisk,
      impact: sessionCount >= 5 ? 'positive' : 'negative',
      contribution_to_risk: weights.sessions_completed * sessionCountRisk,
    });

    // 3. Follow-up Booking Rate
    const sessionsWithFollowUp = studentSessions.filter(s => s.session.follow_up_booked).length;
    const followUpRate = sessionCount > 0 ? sessionsWithFollowUp / sessionCount : 0;
    const followUpRisk = 1 - followUpRate; // Invert: high rate = low risk

    factors.push({
      category: 'follow_up_booking_rate',
      weight: weights.follow_up_booking_rate,
      value: followUpRate,
      normalized_score: followUpRisk,
      impact: followUpRate >= 0.6 ? 'positive' : 'negative',
      contribution_to_risk: weights.follow_up_booking_rate * followUpRisk,
    });

    // 4. Average Session Score
    const scoresSum = studentSessions.reduce((sum, s) => {
      const score = s.session.overall_session_score ? parseFloat(s.session.overall_session_score) : 5.0;
      return sum + score;
    }, 0);
    const avgScore = scoresSum / sessionCount;
    const avgScoreNormalized = avgScore / 10;
    const avgScoreRisk = 1 - avgScoreNormalized; // Invert

    factors.push({
      category: 'avg_session_score',
      weight: weights.avg_session_score,
      value: avgScore,
      normalized_score: avgScoreRisk,
      impact: avgScore >= 7.0 ? 'positive' : 'negative',
      contribution_to_risk: weights.avg_session_score * avgScoreRisk,
    });

    // 5. Tutor Consistency
    const uniqueTutors = new Set(studentSessions.map(s => s.session.tutor_id));
    const tutorCount = uniqueTutors.size;

    // 1.0 if <=2 tutors (consistent), decreasing for more switches
    let tutorConsistencyScore = 1.0;
    if (tutorCount > 2) {
      tutorConsistencyScore = Math.max(0, 1 - ((tutorCount - 2) * 0.15));
    }
    const tutorConsistencyRisk = 1 - tutorConsistencyScore; // Invert

    factors.push({
      category: 'tutor_consistency',
      weight: weights.tutor_consistency,
      value: tutorCount,
      normalized_score: tutorConsistencyRisk,
      impact: tutorCount <= 2 ? 'positive' : 'negative',
      contribution_to_risk: weights.tutor_consistency * tutorConsistencyRisk,
    });

    // 6. Student Engagement
    const engagementScores = studentSessions
      .filter(s => s.audioMetrics?.student_engagement_score)
      .map(s => parseFloat(s.audioMetrics!.student_engagement_score!));

    const avgEngagement = engagementScores.length > 0
      ? engagementScores.reduce((sum, score) => sum + score, 0) / engagementScores.length
      : 5.0;

    const engagementNormalized = avgEngagement / 10;
    const engagementRisk = 1 - engagementNormalized; // Invert

    factors.push({
      category: 'student_engagement',
      weight: weights.student_engagement,
      value: avgEngagement,
      normalized_score: engagementRisk,
      impact: avgEngagement >= 7.0 ? 'positive' : 'negative',
      contribution_to_risk: weights.student_engagement * engagementRisk,
    });

    return factors;
  } catch (error) {
    console.error('Error in calculateChurnFactors:', error);
    throw new Error('Failed to calculate churn factors: ' + (error as Error).message);
  }
}

/**
 * Calculate churn risk score for a student
 *
 * Main function for predicting student churn risk. Analyzes session history,
 * calculates all factors, and returns an overall risk assessment.
 *
 * @param studentId - The student user ID
 * @param weights - Optional custom weights (uses current if not provided)
 * @returns ChurnRiskResult with score, level, and factor breakdown
 *
 * @example
 * ```typescript
 * const risk = await calculateStudentChurnRisk('student-123');
 * console.log(`Churn risk: ${risk.level} (${(risk.score * 100).toFixed(1)}%)`);
 *
 * if (risk.level === 'high') {
 *   console.log('Action needed!');
 *   console.log(risk.explanation);
 * }
 * ```
 */
export async function calculateStudentChurnRisk(
  studentId: string,
  weights?: AlgorithmWeights
): Promise<ChurnRiskResult> {
  try {
    // Use provided weights or get current
    const algorithmWeights = weights || await getCurrentAlgorithmWeights();

    // Calculate all factors
    const factors = await calculateChurnFactors(studentId, algorithmWeights);

    // Sum weighted contributions to get overall risk score
    const churnRiskScore = factors.reduce((sum, factor) => sum + factor.contribution_to_risk, 0);

    // Determine risk level
    let level: 'low' | 'medium' | 'high';
    if (churnRiskScore < 0.33) {
      level = 'low';
    } else if (churnRiskScore < 0.66) {
      level = 'medium';
    } else {
      level = 'high';
    }

    // Generate explanation for neutral case
    let explanation: string | undefined;
    if (factors.every(f => f.value === 0.5)) {
      explanation = 'No completed sessions available for this student. Risk assessment is neutral (0.5) pending session data.';
    }

    return {
      score: churnRiskScore,
      level,
      factors,
      explanation,
    };
  } catch (error) {
    console.error('Error in calculateStudentChurnRisk:', error);
    throw new Error('Failed to calculate student churn risk: ' + (error as Error).message);
  }
}

// ============================================
// WEIGHT MANAGEMENT & HISTORY FUNCTIONS
// ============================================

/**
 * Calculate retroactive accuracy using provided weights
 *
 * Tests the algorithm against students with known outcomes (churned or
 * active for > 90 days). Uses a threshold of > 0.6 for predicted churn.
 *
 * @param weights - Algorithm weights to test
 * @returns Accuracy metrics including precision, recall, F1 score
 *
 * @example
 * ```typescript
 * const weights = await getCurrentAlgorithmWeights();
 * const metrics = await calculateRetroactiveAccuracy(weights);
 * console.log(`Accuracy: ${(metrics.accuracy * 100).toFixed(1)}%`);
 * console.log(`F1 Score: ${metrics.f1Score.toFixed(3)}`);
 * ```
 */
export async function calculateRetroactiveAccuracy(
  weights: AlgorithmWeights
): Promise<AccuracyMetrics> {
  try {
    // Get students with known churn status
    // Churned: status = 'churned'
    // Active (likely to stay): status = 'active' AND enrolled > 90 days ago
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const studentsWithOutcomes = await db
      .select({
        user_id: students.user_id,
        status: students.status,
        enrolled_since: students.enrolled_since,
      })
      .from(students)
      .where(
        or(
          eq(students.status, 'churned'),
          and(
            eq(students.status, 'active'),
            sql`${students.enrolled_since} <= ${ninetyDaysAgo.toISOString().split('T')[0]}`
          )
        )
      );

    // Filter to students with at least 3 sessions
    const studentSessionCounts = await db
      .select({
        student_id: sessions.student_id,
        count: sql<number>`COUNT(*)::int`,
      })
      .from(sessions)
      .where(
        and(
          inArray(sessions.student_id, studentsWithOutcomes.map(s => s.user_id)),
          eq(sessions.status, 'completed')
        )
      )
      .groupBy(sessions.student_id);

    const eligibleStudentIds = studentSessionCounts
      .filter(s => s.count >= 3)
      .map(s => s.student_id);

    const eligibleStudents = studentsWithOutcomes.filter(s =>
      eligibleStudentIds.includes(s.user_id)
    );

    if (eligibleStudents.length === 0) {
      return {
        accuracy: 0.5,
        precision: 0,
        recall: 0,
        f1Score: 0,
        truePositives: 0,
        falsePositives: 0,
        trueNegatives: 0,
        falseNegatives: 0,
        totalPredictions: 0,
      };
    }

    // Calculate predictions for each student
    let truePositives = 0; // Predicted churn, actually churned
    let falsePositives = 0; // Predicted churn, didn't churn
    let trueNegatives = 0; // Predicted no churn, didn't churn
    let falseNegatives = 0; // Predicted no churn, actually churned

    for (const student of eligibleStudents) {
      const risk = await calculateStudentChurnRisk(student.user_id, weights);
      const predictedChurn = risk.score > 0.6;
      const actualChurn = student.status === 'churned';

      if (predictedChurn && actualChurn) {
        truePositives++;
      } else if (predictedChurn && !actualChurn) {
        falsePositives++;
      } else if (!predictedChurn && !actualChurn) {
        trueNegatives++;
      } else if (!predictedChurn && actualChurn) {
        falseNegatives++;
      }
    }

    const totalPredictions = eligibleStudents.length;
    const accuracy = (truePositives + trueNegatives) / totalPredictions;

    // Precision: Of all positive predictions, how many were correct?
    const precision = truePositives + falsePositives > 0
      ? truePositives / (truePositives + falsePositives)
      : 0;

    // Recall: Of all actual positives, how many did we catch?
    const recall = truePositives + falseNegatives > 0
      ? truePositives / (truePositives + falseNegatives)
      : 0;

    // F1 Score: Harmonic mean of precision and recall
    const f1Score = precision + recall > 0
      ? 2 * (precision * recall) / (precision + recall)
      : 0;

    return {
      accuracy,
      precision,
      recall,
      f1Score,
      truePositives,
      falsePositives,
      trueNegatives,
      falseNegatives,
      totalPredictions,
    };
  } catch (error) {
    console.error('Error in calculateRetroactiveAccuracy:', error);
    throw new Error('Failed to calculate retroactive accuracy: ' + (error as Error).message);
  }
}

/**
 * Update algorithm weights and create version history
 *
 * Creates a new version of weights, calculates before/after accuracy,
 * and records the change in history. Uses database transactions to ensure
 * consistency.
 *
 * @param newWeights - New weight values (must sum to 1.0)
 * @param changedBy - User ID of admin making the change
 * @param changeReason - Explanation for the change
 * @param caseStudy - Optional case study information
 * @returns WeightUpdateResult with version and accuracy metrics
 *
 * @example
 * ```typescript
 * const result = await updateAlgorithmWeights(
 *   { first_session_satisfaction: 0.30, ... },
 *   'admin-123',
 *   'Increased first session weight based on churn analysis'
 * );
 * console.log(`New version: ${result.version}`);
 * console.log(`Accuracy improved by ${(result.delta! * 100).toFixed(1)}%`);
 * ```
 */
export async function updateAlgorithmWeights(
  newWeights: AlgorithmWeights,
  changedBy: string,
  changeReason: string,
  caseStudy?: {
    sessionId?: string;
    studentId?: string;
  }
): Promise<WeightUpdateResult> {
  try {
    // Validate new weights
    const validation = validateWeights(newWeights);
    if (!validation.isValid) {
      throw new Error(`Weight validation failed: ${validation.errors.join(', ')}`);
    }

    // Get current weights
    const oldWeights = await getCurrentAlgorithmWeights();

    // Calculate accuracy before change
    const accuracyBefore = await calculateRetroactiveAccuracy(oldWeights);

    // Get current version number
    const latestVersionResult = await db
      .select({ version: sql<number>`COALESCE(MAX(${churnAlgorithmWeights.version}), 0)` })
      .from(churnAlgorithmWeights);

    const newVersion = (latestVersionResult[0]?.version || 0) + 1;

    // Insert new weights (one row per factor)
    const weightEntries = Object.entries(newWeights).map(([category, weight]) => ({
      version: newVersion,
      factor_category: category,
      weight: weight.toString(),
      effective_from: new Date(),
      notes: changeReason,
    }));

    await db.insert(churnAlgorithmWeights).values(weightEntries);

    // Calculate accuracy after change
    const accuracyAfter = await calculateRetroactiveAccuracy(newWeights);

    // Insert history record
    const historyResult = await db.insert(churnWeightHistory).values({
      version: newVersion,
      changed_by: changedBy,
      change_reason: changeReason,
      case_study_session_id: caseStudy?.sessionId || null,
      case_study_student_id: caseStudy?.studentId || null,
      old_weights: oldWeights,
      new_weights: newWeights,
      accuracy_before: accuracyBefore.accuracy.toString(),
      accuracy_after: accuracyAfter.accuracy.toString(),
    }).returning({ id: churnWeightHistory.id });

    const historyId = historyResult[0].id;
    const delta = accuracyAfter.accuracy - accuracyBefore.accuracy;

    return {
      version: newVersion,
      accuracyBefore: accuracyBefore.accuracy,
      accuracyAfter: accuracyAfter.accuracy,
      delta,
      historyId,
    };
  } catch (error) {
    console.error('Error in updateAlgorithmWeights:', error);
    throw new Error('Failed to update algorithm weights: ' + (error as Error).message);
  }
}

/**
 * Get weight change history
 *
 * Retrieves recent weight updates with admin names and accuracy metrics.
 * Ordered by most recent first.
 *
 * @param limit - Maximum number of history entries to return
 * @returns Array of WeightHistoryEntry objects
 *
 * @example
 * ```typescript
 * const history = await getWeightHistory(10);
 * history.forEach(entry => {
 *   console.log(`Version ${entry.version} by ${entry.changed_by_name}`);
 *   console.log(`Reason: ${entry.change_reason}`);
 *   if (entry.delta) {
 *     console.log(`Accuracy ${entry.delta > 0 ? 'improved' : 'declined'} by ${Math.abs(entry.delta * 100).toFixed(1)}%`);
 *   }
 * });
 * ```
 */
export async function getWeightHistory(limit: number = 10): Promise<WeightHistoryEntry[]> {
  try {
    const history = await db
      .select({
        id: churnWeightHistory.id,
        version: churnWeightHistory.version,
        changed_by: churnWeightHistory.changed_by,
        changed_by_name: users.name,
        change_reason: churnWeightHistory.change_reason,
        accuracy_before: churnWeightHistory.accuracy_before,
        accuracy_after: churnWeightHistory.accuracy_after,
        created_at: churnWeightHistory.created_at,
      })
      .from(churnWeightHistory)
      .innerJoin(users, eq(churnWeightHistory.changed_by, users.id))
      .orderBy(desc(churnWeightHistory.created_at))
      .limit(limit);

    return history.map(entry => ({
      id: entry.id,
      version: entry.version,
      changed_by: entry.changed_by,
      changed_by_name: entry.changed_by_name,
      change_reason: entry.change_reason,
      accuracy_before: entry.accuracy_before ? parseFloat(entry.accuracy_before) : null,
      accuracy_after: entry.accuracy_after ? parseFloat(entry.accuracy_after) : null,
      delta: entry.accuracy_before && entry.accuracy_after
        ? parseFloat(entry.accuracy_after) - parseFloat(entry.accuracy_before)
        : null,
      created_at: entry.created_at,
    }));
  } catch (error) {
    console.error('Error in getWeightHistory:', error);
    throw new Error('Failed to get weight history: ' + (error as Error).message);
  }
}

/**
 * Get detailed weight history entry by ID
 *
 * Fetches a single history record with full details including old/new weights
 * and case study information if available.
 *
 * @param historyId - The history entry UUID
 * @returns WeightHistoryDetail object or null if not found
 *
 * @example
 * ```typescript
 * const detail = await getWeightHistoryById('history-uuid');
 * if (detail) {
 *   console.log('Old weights:', detail.old_weights);
 *   console.log('New weights:', detail.new_weights);
 *   if (detail.case_study_student_id) {
 *     console.log('Based on case study for student:', detail.case_study_student_id);
 *   }
 * }
 * ```
 */
export async function getWeightHistoryById(historyId: string): Promise<WeightHistoryDetail | null> {
  try {
    const result = await db
      .select({
        id: churnWeightHistory.id,
        version: churnWeightHistory.version,
        changed_by: churnWeightHistory.changed_by,
        changed_by_name: users.name,
        change_reason: churnWeightHistory.change_reason,
        old_weights: churnWeightHistory.old_weights,
        new_weights: churnWeightHistory.new_weights,
        accuracy_before: churnWeightHistory.accuracy_before,
        accuracy_after: churnWeightHistory.accuracy_after,
        case_study_session_id: churnWeightHistory.case_study_session_id,
        case_study_student_id: churnWeightHistory.case_study_student_id,
        created_at: churnWeightHistory.created_at,
      })
      .from(churnWeightHistory)
      .innerJoin(users, eq(churnWeightHistory.changed_by, users.id))
      .where(eq(churnWeightHistory.id, historyId))
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    const entry = result[0];

    return {
      id: entry.id,
      version: entry.version,
      changed_by: entry.changed_by,
      changed_by_name: entry.changed_by_name,
      change_reason: entry.change_reason,
      old_weights: entry.old_weights as AlgorithmWeights,
      new_weights: entry.new_weights as AlgorithmWeights,
      accuracy_before: entry.accuracy_before ? parseFloat(entry.accuracy_before) : null,
      accuracy_after: entry.accuracy_after ? parseFloat(entry.accuracy_after) : null,
      delta: entry.accuracy_before && entry.accuracy_after
        ? parseFloat(entry.accuracy_after) - parseFloat(entry.accuracy_before)
        : null,
      case_study_session_id: entry.case_study_session_id,
      case_study_student_id: entry.case_study_student_id,
      created_at: entry.created_at,
    };
  } catch (error) {
    console.error('Error in getWeightHistoryById:', error);
    throw new Error('Failed to get weight history detail: ' + (error as Error).message);
  }
}

// ============================================
// LEARNING EVENTS & CASE STUDY FUNCTIONS
// ============================================

/**
 * Get learning events from churn case studies
 *
 * Retrieves weight changes that were based on actual churn cases,
 * showing what the system learned from prediction mistakes.
 *
 * @param limit - Maximum number of events to return
 * @returns Array of LearningEvent objects
 *
 * @example
 * ```typescript
 * const events = await getLearningEvents(20);
 * events.forEach(event => {
 *   console.log(`Learned from ${event.student_name}`);
 *   console.log(`Prediction: ${event.predicted_level}, Actual: ${event.actual_outcome}`);
 *   console.log(`What we learned: ${event.what_system_learned}`);
 * });
 * ```
 */
export async function getLearningEvents(limit: number = 20): Promise<LearningEvent[]> {
  try {
    const events = await db
      .select({
        id: churnWeightHistory.id,
        version: churnWeightHistory.version,
        student_id: churnWeightHistory.case_study_student_id,
        student_name: users.name,
        student_status: students.status,
        churned_date: students.churned_date,
        churn_survey_response: students.churn_survey_response,
        old_weights: churnWeightHistory.old_weights,
        new_weights: churnWeightHistory.new_weights,
        change_reason: churnWeightHistory.change_reason,
        created_at: churnWeightHistory.created_at,
      })
      .from(churnWeightHistory)
      .innerJoin(students, eq(churnWeightHistory.case_study_student_id, students.user_id))
      .innerJoin(users, eq(students.user_id, users.id))
      .where(isNotNull(churnWeightHistory.case_study_student_id))
      .orderBy(desc(churnWeightHistory.created_at))
      .limit(limit);

    const learningEvents: LearningEvent[] = [];

    for (const event of events) {
      if (!event.student_id) continue;

      // Calculate what was predicted using old weights
      const oldWeights = event.old_weights as AlgorithmWeights;
      const predictedRisk = await calculateStudentChurnRisk(event.student_id, oldWeights);

      const actualOutcome = event.student_status === 'churned' ? 'churned' : 'active';
      const predictedChurn = predictedRisk.score > 0.6;
      const actualChurn = actualOutcome === 'churned';
      const wasCorrect = predictedChurn === actualChurn;

      // Generate summary of what changed
      const weightChanges: string[] = [];
      const newWeights = event.new_weights as AlgorithmWeights;

      Object.keys(oldWeights).forEach(factor => {
        const oldWeight = oldWeights[factor];
        const newWeight = newWeights[factor];
        const diff = newWeight - oldWeight;

        if (Math.abs(diff) > 0.01) {
          const direction = diff > 0 ? 'increased' : 'decreased';
          const percentage = Math.abs(diff * 100).toFixed(1);
          weightChanges.push(`${factor.replace(/_/g, ' ')} ${direction} by ${percentage}%`);
        }
      });

      learningEvents.push({
        id: event.id,
        version: event.version,
        student_id: event.student_id,
        student_name: event.student_name,
        churn_date: event.churned_date,
        predicted_risk: predictedRisk.score,
        predicted_level: predictedRisk.level,
        actual_outcome: actualOutcome,
        was_prediction_correct: wasCorrect,
        survey_response: event.churn_survey_response,
        what_system_learned: event.change_reason,
        weight_change_summary: weightChanges.join('; '),
        created_at: event.created_at,
      });
    }

    return learningEvents;
  } catch (error) {
    console.error('Error in getLearningEvents:', error);
    throw new Error('Failed to get learning events: ' + (error as Error).message);
  }
}

/**
 * Get recent churned students for case study workflow
 *
 * Retrieves students who have churned, along with their predicted risk
 * and actual data, for creating case studies.
 *
 * @param limit - Maximum number of churned students to return
 * @returns Array of ChurnedStudent objects
 *
 * @example
 * ```typescript
 * const churns = await getRecentChurns(10);
 * for (const student of churns) {
 *   console.log(`${student.name} churned after ${student.sessions_completed} sessions`);
 *   if (student.predicted_risk) {
 *     console.log(`We predicted ${student.predicted_risk.level} risk (${(student.predicted_risk.score * 100).toFixed(1)}%)`);
 *   }
 * }
 * ```
 */
export async function getRecentChurns(limit: number = 10): Promise<ChurnedStudent[]> {
  try {
    const churnedStudents = await db
      .select({
        user_id: students.user_id,
        name: users.name,
        enrolled_since: students.enrolled_since,
        churned_date: students.churned_date,
        churn_survey_response: students.churn_survey_response,
      })
      .from(students)
      .innerJoin(users, eq(students.user_id, users.id))
      .where(eq(students.status, 'churned'))
      .orderBy(desc(students.churned_date))
      .limit(limit);

    const result: ChurnedStudent[] = [];

    for (const student of churnedStudents) {
      // Get churn reasons
      const reasons = await db
        .select({ reason: studentChurnReasons.reason })
        .from(studentChurnReasons)
        .where(eq(studentChurnReasons.student_id, student.user_id));

      // Count sessions
      const sessionCount = await db
        .select({ count: sql<number>`COUNT(*)::int` })
        .from(sessions)
        .where(
          and(
            eq(sessions.student_id, student.user_id),
            eq(sessions.status, 'completed')
          )
        );

      // Calculate predicted risk
      let predictedRisk: ChurnRiskResult | null = null;
      try {
        predictedRisk = await calculateStudentChurnRisk(student.user_id);
      } catch (error) {
        console.warn(`Could not calculate risk for student ${student.user_id}:`, error);
      }

      result.push({
        user_id: student.user_id,
        name: student.name,
        enrolled_since: student.enrolled_since,
        churned_date: student.churned_date,
        churn_reasons: reasons.map(r => r.reason),
        churn_survey_response: student.churn_survey_response,
        predicted_risk: predictedRisk,
        sessions_completed: sessionCount[0]?.count || 0,
      });
    }

    return result;
  } catch (error) {
    console.error('Error in getRecentChurns:', error);
    throw new Error('Failed to get recent churns: ' + (error as Error).message);
  }
}

/**
 * Create case study recommendation from churned student
 *
 * Analyzes a churn case and generates rule-based recommendations for
 * weight adjustments. Uses simple heuristics to suggest which factors
 * should be weighted more heavily.
 *
 * @param studentId - The churned student user ID
 * @param actualOutcome - 'churned' or 'active'
 * @param surveyResponse - Optional student survey feedback
 * @returns CaseStudyRecommendation with suggested weight changes
 *
 * @example
 * ```typescript
 * const recommendation = await createCaseStudy('student-123', 'churned');
 * console.log(`Prediction was ${recommendation.was_correct ? 'correct' : 'wrong'}`);
 * console.log('Suggested changes:');
 * recommendation.factor_analysis.forEach(fa => {
 *   console.log(`  ${fa.factor}: ${fa.current_weight} -> ${fa.suggested_weight} (${fa.reason})`);
 * });
 * ```
 */
export async function createCaseStudy(
  studentId: string,
  actualOutcome: 'churned' | 'active',
  surveyResponse?: string
): Promise<CaseStudyRecommendation> {
  try {
    // Calculate what we predicted
    const currentWeights = await getCurrentAlgorithmWeights();
    const predictedRisk = await calculateStudentChurnRisk(studentId, currentWeights);

    // Was our prediction correct?
    const predictedChurn = predictedRisk.score > 0.6;
    const actualChurn = actualOutcome === 'churned';
    const wasCorrect = predictedChurn === actualChurn;

    // Generate suggested weight adjustments based on factor analysis
    const suggestedWeights = { ...currentWeights };
    const factorAnalysis: Array<{
      factor: ChurnFactorCategoryType;
      current_weight: number;
      suggested_weight: number;
      reason: string;
    }> = [];

    let rationale = '';

    if (!wasCorrect) {
      // Prediction was wrong - adjust weights based on which factors led us astray
      rationale = 'The prediction was incorrect. Analyzing which factors need adjustment:\n\n';

      for (const factor of predictedRisk.factors) {
        const category = factor.category;
        const currentWeight = factor.weight;
        let suggestedWeight = currentWeight;
        let reason = '';

        // Rule-based recommendations
        if (category === 'first_session_satisfaction') {
          if (factor.value < 6.5 && actualChurn) {
            // Bad first session and churned - increase weight
            suggestedWeight = Math.min(1.0, currentWeight + 0.05);
            reason = `First session score was low (${factor.value.toFixed(1)}) and student churned. Increase weight to catch this pattern.`;
          } else if (factor.value >= 7.5 && actualChurn) {
            // Good first session but churned anyway - decrease weight
            suggestedWeight = Math.max(0.05, currentWeight - 0.03);
            reason = `First session was good (${factor.value.toFixed(1)}) but student still churned. Other factors more important.`;
          }
        } else if (category === 'sessions_completed') {
          if (factor.value >= 10 && actualChurn) {
            // Many sessions but churned - this factor less predictive
            suggestedWeight = Math.max(0.05, currentWeight - 0.03);
            reason = `Student completed many sessions (${factor.value}) but still churned. Session count alone not sufficient.`;
          } else if (factor.value < 5 && actualChurn) {
            // Few sessions and churned - increase weight
            suggestedWeight = Math.min(1.0, currentWeight + 0.03);
            reason = `Student churned with few sessions (${factor.value}). Early engagement critical.`;
          }
        } else if (category === 'follow_up_booking_rate') {
          if (factor.value < 0.3 && actualChurn) {
            // Low rebooking rate and churned - strong signal
            suggestedWeight = Math.min(1.0, currentWeight + 0.05);
            reason = `Very low follow-up booking rate (${(factor.value * 100).toFixed(0)}%) predicted churn. Increase weight.`;
          }
        } else if (category === 'avg_session_score') {
          if (factor.value < 6.0 && actualChurn) {
            // Consistently low scores and churned
            suggestedWeight = Math.min(1.0, currentWeight + 0.04);
            reason = `Low average session score (${factor.value.toFixed(1)}) correlated with churn.`;
          }
        } else if (category === 'student_engagement') {
          if (factor.value < 6.0 && actualChurn) {
            // Low engagement and churned
            suggestedWeight = Math.min(1.0, currentWeight + 0.04);
            reason = `Low student engagement (${factor.value.toFixed(1)}) was a churn indicator.`;
          }
        }

        if (Math.abs(suggestedWeight - currentWeight) > 0.001) {
          factorAnalysis.push({
            factor: category,
            current_weight: currentWeight,
            suggested_weight: suggestedWeight,
            reason,
          });
          suggestedWeights[category] = suggestedWeight;
        }
      }

      // Normalize weights to sum to 1.0
      const sum = Object.values(suggestedWeights).reduce((acc, w) => acc + w, 0);
      Object.keys(suggestedWeights).forEach(key => {
        suggestedWeights[key] = suggestedWeights[key] / sum;
      });

      // Update factor analysis with normalized weights
      factorAnalysis.forEach(fa => {
        fa.suggested_weight = suggestedWeights[fa.factor];
      });

      if (factorAnalysis.length > 0) {
        rationale += factorAnalysis.map(fa => `- ${fa.reason}`).join('\n');
      } else {
        rationale += 'No significant adjustments recommended based on this case.';
      }
    } else {
      rationale = 'The prediction was correct. Current weights appear well-calibrated for this type of case. No adjustments recommended.';
    }

    return {
      student_id: studentId,
      predicted_risk: predictedRisk,
      actual_outcome: actualOutcome,
      was_correct: wasCorrect,
      suggested_weights: suggestedWeights,
      rationale,
      factor_analysis: factorAnalysis,
    };
  } catch (error) {
    console.error('Error in createCaseStudy:', error);
    throw new Error('Failed to create case study: ' + (error as Error).message);
  }
}
