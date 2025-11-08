'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import {
  updateAlgorithmWeights,
  calculateRetroactiveAccuracy,
  createCaseStudy,
  validateWeights,
  type AccuracyMetrics,
  type CaseStudyRecommendation,
} from '@/services/churn-service';

// ============================================
// RETURN TYPES
// ============================================

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

// ============================================
// SERVER ACTIONS
// ============================================

/**
 * Update algorithm weights with validation and history tracking
 *
 * Validates user authentication, weight values, and creates a new version
 * of the algorithm weights with before/after accuracy metrics.
 */
export async function updateWeights(
  newWeights: Record<string, number>,
  changeReason: string
): Promise<ActionResult<{
  version: number;
  accuracyBefore: number | null;
  accuracyAfter: number | null;
  delta: number | null;
}>> {
  try {
    // Authenticate user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'Authentication required' };
    }

    // Verify user is admin (check role in users table)
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userError || !userData) {
      return { success: false, error: 'User data not found' };
    }

    if (userData.role !== 'admin') {
      return { success: false, error: 'Admin access required' };
    }

    // Validate weights
    const validation = validateWeights(newWeights);
    if (!validation.isValid) {
      return {
        success: false,
        error: `Weight validation failed: ${validation.errors.join(', ')}`,
      };
    }

    // Update weights in database
    const result = await updateAlgorithmWeights(
      newWeights,
      user.id,
      changeReason
    );

    // Revalidate the algorithm page
    revalidatePath('/dashboard/algorithm');

    return {
      success: true,
      data: {
        version: result.version,
        accuracyBefore: result.accuracyBefore,
        accuracyAfter: result.accuracyAfter,
        delta: result.delta,
      },
    };
  } catch (error) {
    console.error('Error in updateWeights action:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update weights',
    };
  }
}

/**
 * Simulate weight change impact without saving
 *
 * Calculates retroactive accuracy metrics for proposed weights
 * to preview impact before applying changes.
 */
export async function simulateWeightChange(
  proposedWeights: Record<string, number>
): Promise<ActionResult<{
  metrics: AccuracyMetrics;
  affectedStudents: Array<{
    student_id: string;
    student_name: string;
    old_prediction: 'churn' | 'no_churn';
    new_prediction: 'churn' | 'no_churn';
    actual_outcome: 'churned' | 'active';
    old_risk_score: number;
    new_risk_score: number;
    is_improvement: boolean;
  }>;
}>> {
  try {
    // Validate weights
    const validation = validateWeights(proposedWeights);
    if (!validation.isValid) {
      return {
        success: false,
        error: `Weight validation failed: ${validation.errors.join(', ')}`,
      };
    }

    // Calculate retroactive accuracy
    const metrics = await calculateRetroactiveAccuracy(proposedWeights);

    // For MVP, return metrics with empty affected students
    // In future, could calculate specific student prediction changes
    return {
      success: true,
      data: {
        metrics,
        affectedStudents: [],
      },
    };
  } catch (error) {
    console.error('Error in simulateWeightChange action:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to simulate weight change',
    };
  }
}

/**
 * Create a case study from a churned student
 *
 * Analyzes the student's churn case and generates AI-recommended
 * weight adjustments based on prediction accuracy.
 */
export async function createChurnCaseStudy(
  studentId: string,
  surveyResponse?: string
): Promise<ActionResult<CaseStudyRecommendation>> {
  try {
    // Authenticate user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'Authentication required' };
    }

    // Get student status
    const { data: studentData, error: studentError } = await supabase
      .from('students')
      .select('status')
      .eq('user_id', studentId)
      .single();

    if (studentError || !studentData) {
      return { success: false, error: 'Student not found' };
    }

    const actualOutcome = studentData.status === 'churned' ? 'churned' : 'active';

    // Create case study
    const caseStudy = await createCaseStudy(studentId, actualOutcome, surveyResponse);

    return {
      success: true,
      data: caseStudy,
    };
  } catch (error) {
    console.error('Error in createChurnCaseStudy action:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create case study',
    };
  }
}

/**
 * Apply weights from a case study
 *
 * Accepts recommended or modified weights from a case study analysis
 * and updates the algorithm with proper audit trail.
 */
export async function applyCaseStudyWeights(
  studentId: string,
  acceptedWeights: Record<string, number>,
  changeReason: string
): Promise<ActionResult<{
  version: number;
  accuracyBefore: number | null;
  accuracyAfter: number | null;
  delta: number | null;
}>> {
  try {
    // Authenticate user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'Authentication required' };
    }

    // Verify admin
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userError || !userData || userData.role !== 'admin') {
      return { success: false, error: 'Admin access required' };
    }

    // Validate weights
    const validation = validateWeights(acceptedWeights);
    if (!validation.isValid) {
      return {
        success: false,
        error: `Weight validation failed: ${validation.errors.join(', ')}`,
      };
    }

    // Update weights with case study link
    const result = await updateAlgorithmWeights(
      acceptedWeights,
      user.id,
      changeReason,
      {
        studentId,
      }
    );

    // Revalidate the algorithm page
    revalidatePath('/dashboard/algorithm');

    return {
      success: true,
      data: {
        version: result.version,
        accuracyBefore: result.accuracyBefore,
        accuracyAfter: result.accuracyAfter,
        delta: result.delta,
      },
    };
  } catch (error) {
    console.error('Error in applyCaseStudyWeights action:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to apply case study weights',
    };
  }
}
