# Phase 4.5: Student Detail Page - Implementation Tasks

## Context

Phase 4.5 implements the Student Detail Page, a critical interface for tracking individual student journeys, monitoring churn risk, and identifying patterns that lead to student retention or attrition. This page serves as the primary tool for understanding student engagement and intervening before churn occurs.

The Student Detail Page is unique among the admin views because it emphasizes **churn risk assessment** as its central feature. Unlike the Tutor Detail Page (which focuses on performance coaching), this page prioritizes early warning signals and protective factors that influence student retention. The churn risk calculation uses a weighted algorithm (defined in project_overview.md lines 841-849) that combines multiple factors to produce an actionable risk score.

This phase builds directly on Phase 4.1's data layer (session-service.ts, tutor-service.ts, student-service.ts) and Phase 3's component library (metric cards, badges, data tables, charts). The page follows the six-section layout specified in project_overview.md lines 196-240:

1. **Student Header** - Anonymized identification with status badge
2. **Churn Risk Assessment Panel** - Prominent placement with weighted factors breakdown
3. **Student Stats Grid** - Key performance metrics overview
4. **Session History** - Student perspective of all sessions
5. **Tutor History** - All tutors worked with and performance tracking
6. **Churn Management** - Appears only if status = churned, for post-mortem analysis

**Critical Requirements:**
- Churn risk calculation must use the weighted algorithm from churn_algorithm_weights table
- Risk factors and protective factors must show individual contributions to overall score
- Session history must highlight tutor switches and first session outcomes
- All calculations handle missing data gracefully (not all sessions have feedback/ratings)
- Status badge color-coding: Active (green), At Risk (yellow), Churned (red)

**Dependencies:**
- Phase 4.1 complete (student-service.ts, session-service.ts, churn-service.ts exist)
- Phase 3 complete (all reusable components available)
- Database schema tables: students, sessions, session_feedback, student_subjects, student_churn_reasons, churn_algorithm_weights

## Instructions for AI Agent

**Standard Workflow:**
1. **Read Phase**: Start each PR by reading all files listed in the tasks to understand current implementation and patterns
2. **Implement Tasks**: Complete tasks in order, marking each with [x] when finished
3. **Test**: Follow the "What to Test" section to validate functionality
4. **Summary**: Provide completion summary listing files changed and key functionality
5. **Wait for Approval**: Do not proceed to next PR until current one is approved

**File Organization:**
- Page component: `/Users/mike/gauntlet/tutor-dashboard/app/students/[studentId]/page.tsx`
- Service layer: `/Users/mike/gauntlet/tutor-dashboard/services/student-service.ts` (extend from Phase 4.1)
- Churn calculations: `/Users/mike/gauntlet/tutor-dashboard/services/churn-service.ts` (extend from Phase 4.1)
- New components: `/Users/mike/gauntlet/tutor-dashboard/components/students/` (domain-specific components)
- Reuse from: `/Users/mike/gauntlet/tutor-dashboard/components/ui/` (Phase 3 components)

**Pattern to Follow:**
- Server Component for page.tsx (fetches data, passes to client components)
- Use services layer for all data access (never query directly in page)
- Client components for interactive elements (marked with 'use client')
- Consistent styling with existing pages (dashboard, tutor detail)

---

## Phase 1: Student Data Service Layer

**Estimated Time:** 3-4 hours

This phase extends the student-service.ts with functions specifically needed for the Student Detail Page, including churn risk calculations and student-specific aggregations.

### PR 1.1: Student Profile & Stats Service Functions

**Goal:** Create comprehensive student data retrieval with calculated metrics

**Read these files first:**
- `/Users/mike/gauntlet/tutor-dashboard/lib/db/schema/students.ts`
- `/Users/mike/gauntlet/tutor-dashboard/lib/db/schema/sessions.ts`
- `/Users/mike/gauntlet/tutor-dashboard/lib/db/types.ts`
- `/Users/mike/gauntlet/tutor-dashboard/services/session-service.ts` (from Phase 4.1)
- `/Users/mike/gauntlet/tutor-dashboard/docs/project_overview.md` (lines 453-552 for Student model)

**Tasks:**
- [ ] Read `/Users/mike/gauntlet/tutor-dashboard/services/student-service.ts` to understand existing implementation
- [ ] Extend `student-service.ts` with `getStudentDetailById(studentId: string)`:
  - Fetch student with user info, subjects, status, enrolled_since
  - Join with student_subjects and subjects table
  - Return `StudentDetailProfile` interface
  - Include parent_email, grade_level, learning_goals, churned_date if applicable
- [ ] Implement `getStudentStats(studentId: string)`:
  - Calculate sessions_completed (status = 'completed')
  - Calculate avg_session_score from sessions.overall_session_score
  - Calculate avg_engagement from session_audio_metrics.student_engagement_score
  - Calculate avg_satisfaction_rating from session_feedback.student_satisfaction_rating (handle missing)
  - Calculate rebook_rate: sessions with follow_up_booked / total completed
  - Count tutors_worked_with: distinct tutor_id from sessions
  - Return `StudentStats` interface with all metrics (nullable for missing data)
- [ ] Implement `getStudentSessionSummary(studentId: string)`:
  - Get first_session_date (earliest scheduled_start)
  - Get last_session_date (most recent scheduled_start)
  - Get total session count
  - Get session count by status (completed, no_show, cancelled, rescheduled)
  - Return `StudentSessionSummary` interface
- [ ] Define TypeScript interfaces for all return types:
  - `StudentDetailProfile` (extends base student with relations)
  - `StudentStats` (all calculated metrics)
  - `StudentSessionSummary` (date ranges and counts)
- [ ] Handle edge cases:
  - Students with zero sessions (return null/0 for calculated metrics)
  - Missing feedback/ratings (exclude from averages, don't count as 0)
  - Paused vs churned status logic

**What to Test:**
1. Build project - verify no TypeScript errors
2. Call getStudentDetailById with valid student ID - verify subjects loaded
3. Call getStudentStats with student who has sessions - verify calculations correct
4. Call getStudentStats with student who has NO sessions - verify no crashes, returns zeros/nulls
5. Call getStudentStats with student who has sessions but NO feedback - verify avg_satisfaction_rating is null

**Files Changed:**
- `/Users/mike/gauntlet/tutor-dashboard/services/student-service.ts` - Add student detail functions

**Notes:**
- Use Drizzle's `avg()`, `count()`, `countDistinct()` for aggregations
- Use `leftJoin` for optional data (feedback), `innerJoin` for required (sessions)
- When calculating averages, use SQL `AVG()` but filter out NULL values first
- rebook_rate formula: `COUNT(follow_up_booked = true) / COUNT(status = 'completed')`

---

### PR 1.2: Student Session History Service Functions

**Goal:** Create student-centric session history with tutor tracking

**Read these files first:**
- `/Users/mike/gauntlet/tutor-dashboard/services/session-service.ts` (from Phase 4.1)
- `/Users/mike/gauntlet/tutor-dashboard/lib/db/schema/sessions.ts`
- `/Users/mike/gauntlet/tutor-dashboard/docs/project_overview.md` (lines 226-240 for layout specs)

**Tasks:**
- [ ] Read `/Users/mike/gauntlet/tutor-dashboard/services/session-service.ts`
- [ ] Extend `session-service.ts` with `getStudentSessionHistory(studentId: string, options?)`:
  - Fetch all sessions for student with tutor info (name, user_id)
  - Include subject name, scheduled_start, actual_duration
  - Include overall_session_score, student engagement score
  - Include student_satisfaction_rating from feedback (may be null)
  - Include session_number (for tracking progression with each tutor)
  - Support optional filters: tutor_id, date_range, status
  - Order by scheduled_start DESC
  - Limit to 100 by default (pagination support)
  - Return array of `StudentSessionHistoryItem` interface
- [ ] Implement `getStudentTutorSwitches(studentId: string)`:
  - Identify sessions where tutor_id changed from previous session
  - Return array of `TutorSwitch` objects: { from_tutor_id, to_tutor_id, switch_date, session_id }
  - Use window functions or ordered queries to detect changes
  - Include reason if available (from session notes or status)
- [ ] Implement `getStudentFirstSessionOutcomes(studentId: string)`:
  - For each tutor the student worked with, get session_number = 1
  - Return first session score, satisfaction rating, follow_up_booked
  - Critical for churn prediction (first session satisfaction weight = 0.25)
  - Return array of `FirstSessionOutcome` interface
- [ ] Define TypeScript interfaces:
  - `StudentSessionHistoryItem` (session with tutor context)
  - `TutorSwitch` (tutor change tracking)
  - `FirstSessionOutcome` (first session analysis)

**What to Test:**
1. Build project - verify compilation
2. Call getStudentSessionHistory for student with multiple tutors - verify tutor names included
3. Call getStudentTutorSwitches for student who changed tutors - verify switches detected
4. Call getStudentFirstSessionOutcomes - verify only session_number = 1 returned
5. Test with student who has incomplete data (no feedback) - verify doesn't crash

**Files Changed:**
- `/Users/mike/gauntlet/tutor-dashboard/services/session-service.ts` - Add student session history functions

**Notes:**
- Tutor switches are important signals for churn risk (project_overview.md line 549)
- First session outcomes heavily influence churn prediction (24% of churners fail here)
- Use Drizzle's `orderBy()` and window functions for detecting switches
- session_number field already exists in sessions table for tracking progression

---

### PR 1.3: Tutor History Service Functions

**Goal:** Create functions to track all tutors a student has worked with

**Read these files first:**
- `/Users/mike/gauntlet/tutor-dashboard/services/tutor-service.ts` (from Phase 4.1)
- `/Users/mike/gauntlet/tutor-dashboard/lib/db/schema/sessions.ts`
- `/Users/mike/gauntlet/tutor-dashboard/docs/project_overview.md` (lines 230-234 for tutor history)

**Tasks:**
- [ ] Read `/Users/mike/gauntlet/tutor-dashboard/services/tutor-service.ts`
- [ ] Create helper function `getStudentTutorHistory(studentId: string)`:
  - Get all distinct tutors student has worked with
  - For each tutor, calculate:
    - Total sessions together
    - Avg session score for this tutor-student pair
    - Avg student satisfaction rating (if available)
    - First session date with this tutor
    - Last session date with this tutor
    - Rebook rate specifically with this tutor
  - Include tutor name, user_id, profile info
  - Order by first session date ASC (chronological tutors)
  - Return array of `StudentTutorHistory` interface
- [ ] Implement `getStudentCurrentTutor(studentId: string)`:
  - Identify the most recent tutor (from latest session)
  - Return tutor profile with session count
  - Used to highlight "current" relationship
  - Return `CurrentTutorInfo` interface or null
- [ ] Implement `getTutorCompatibilityScore(studentId: string, tutorId: string)`:
  - Calculate compatibility based on:
    - Avg session score for this pair
    - Avg engagement score
    - Rebook rate together
    - Student satisfaction ratings
  - Return score 0-10
  - Used for identifying good/bad tutor matches
  - Return number
- [ ] Define TypeScript interfaces:
  - `StudentTutorHistory` (per-tutor performance with student)
  - `CurrentTutorInfo` (active tutor relationship)

**What to Test:**
1. Build project - verify no errors
2. Call getStudentTutorHistory for student with multiple tutors - verify chronological order
3. Call getStudentTutorHistory - verify per-tutor metrics are correctly aggregated
4. Call getStudentCurrentTutor for active student - verify returns most recent tutor
5. Call getTutorCompatibilityScore - verify score in 0-10 range

**Files Changed:**
- `/Users/mike/gauntlet/tutor-dashboard/services/tutor-service.ts` - Add student-tutor relationship functions

**Notes:**
- Tutor consistency is a churn factor (weight 0.10) per project_overview.md line 846
- Tutor switches are risk signals, but sometimes switching improves outcomes
- Compatibility score helps identify if student needs different tutor match
- Use GROUP BY tutor_id with aggregations for per-tutor metrics

---

## Phase 2: Churn Risk Calculation Service

**Estimated Time:** 4-5 hours

This phase implements the core churn prediction algorithm with weighted factors, as specified in project_overview.md lines 841-849 and detailed in section 3.4 (Student Model).

### PR 2.1: Churn Algorithm Weights Service

**Goal:** Create service to fetch and manage churn algorithm weights

**Read these files first:**
- `/Users/mike/gauntlet/tutor-dashboard/lib/db/schema/churn.ts`
- `/Users/mike/gauntlet/tutor-dashboard/docs/project_overview.md` (lines 816-849 for algorithm versioning)
- `/Users/mike/gauntlet/tutor-dashboard/lib/db/types.ts`

**Tasks:**
- [ ] Create NEW: `/Users/mike/gauntlet/tutor-dashboard/services/churn-service.ts`
- [ ] Implement `getCurrentChurnWeights()`:
  - Fetch latest version of weights from churn_algorithm_weights table
  - Query: WHERE version = (SELECT MAX(version) FROM churn_algorithm_weights)
  - Group by factor_category to get current weight for each factor
  - Return `ChurnWeights` object: { [factor: string]: number }
  - Validate weights sum to 1.0 (throw error if not)
- [ ] Implement `getChurnWeightsByVersion(version: number)`:
  - Fetch specific historical version of weights
  - Used for comparing algorithm changes over time
  - Return `ChurnWeights` object
- [ ] Implement `getChurnFactorCategories()`:
  - Return array of all factor categories with descriptions:
    - first_session_satisfaction
    - sessions_completed
    - follow_up_booking_rate
    - avg_session_score
    - tutor_consistency
    - student_engagement
    - tutor_switch_frequency (optional)
    - scheduling_friction (optional)
    - response_rate (optional)
  - Return `ChurnFactorCategory[]` with name, description, default_weight
- [ ] Define TypeScript interfaces:
  - `ChurnWeights` (map of factor to weight)
  - `ChurnFactorCategory` (factor metadata)
  - `ChurnFactorCategoryType` (enum of factor names)

**What to Test:**
1. Build project - verify no TypeScript errors
2. Call getCurrentChurnWeights() - verify returns object with all factors
3. Verify weights sum to 1.0 - validate with console.log(Object.values(weights).reduce((a,b) => a+b))
4. Call getChurnFactorCategories() - verify returns descriptions for all factors

**Files Changed:**
- NEW: `/Users/mike/gauntlet/tutor-dashboard/services/churn-service.ts` - Churn algorithm logic

**Notes:**
- Initial weights from project_overview.md line 842-847:
  - first_session_satisfaction: 0.25
  - sessions_completed: 0.15
  - follow_up_booking_rate: 0.20
  - avg_session_score: 0.15
  - tutor_consistency: 0.10
  - student_engagement: 0.15
- Weights are stored in database and can evolve (Phase 4.6 Algorithm Refinement)
- All weights must sum to exactly 1.0 for algorithm to work correctly

---

### PR 2.2: Churn Factor Calculation Functions

**Goal:** Calculate individual churn factors from student data

**Read these files first:**
- `/Users/mike/gauntlet/tutor-dashboard/services/student-service.ts` (completed PR 1.1-1.3)
- `/Users/mike/gauntlet/tutor-dashboard/services/session-service.ts` (from Phase 4.1)
- `/Users/mike/gauntlet/tutor-dashboard/docs/project_overview.md` (lines 533-552 for ChurnFactor interface)

**Tasks:**
- [ ] Extend `/Users/mike/gauntlet/tutor-dashboard/services/churn-service.ts`
- [ ] Implement `calculateFirstSessionSatisfaction(studentId: string)`:
  - Get first session (session_number = 1, earliest date)
  - Extract overall_session_score and student_satisfaction_rating
  - If both available, average them (normalize rating from 1-5 to 0-10)
  - If only one available, use that value
  - Return normalized score 0-10 (higher = lower churn risk)
  - Return null if no first session data
- [ ] Implement `calculateSessionsCompletedScore(studentId: string)`:
  - Count completed sessions
  - Normalize to 0-10 scale: min 0 sessions = 0, 10+ sessions = 10
  - Formula: Math.min(sessionsCompleted / 10, 1.0) * 10
  - Return score 0-10 (more sessions = lower churn risk)
- [ ] Implement `calculateFollowUpBookingRate(studentId: string)`:
  - Calculate percentage of sessions where follow_up_booked = true
  - Count completed sessions with follow_up_booked / total completed
  - Normalize to 0-10: 0% = 0, 100% = 10
  - Return score 0-10
- [ ] Implement `calculateAvgSessionScore(studentId: string)`:
  - Get average of all overall_session_score for student's sessions
  - Already on 0-10 scale, return as-is
  - Return null if no sessions
- [ ] Implement `calculateTutorConsistency(studentId: string)`:
  - Count distinct tutors student has worked with
  - Calculate: 10 - (tutor_switch_count * 2)
  - Max penalty for lots of switching, min 0
  - Return score 0-10 (fewer tutors = higher score = lower churn risk)
- [ ] Implement `calculateStudentEngagement(studentId: string)`:
  - Average student_engagement_score from session_audio_metrics
  - Already on 0-10 scale
  - Return null if no audio metrics available
- [ ] Helper function `normalizeFactorValue(rawValue: number, min: number, max: number)`:
  - Normalize any metric to 0-10 scale
  - Used for custom factors in future
- [ ] Define TypeScript interfaces:
  - `ChurnFactorValue` (raw value, normalized score, data availability)

**What to Test:**
1. Build project - verify compilation
2. Call calculateFirstSessionSatisfaction with student who had poor first session - verify low score
3. Call calculateSessionsCompletedScore with student who has 2 sessions - verify ~2.0 score
4. Call calculateSessionsCompletedScore with student who has 15 sessions - verify 10.0 score
5. Call calculateTutorConsistency with student who had 3 tutors - verify penalty applied
6. Test all functions with student who has NO data - verify returns null gracefully

**Files Changed:**
- `/Users/mike/gauntlet/tutor-dashboard/services/churn-service.ts` - Add individual factor calculations

**Notes:**
- All scores must normalize to 0-10 where higher = LOWER churn risk (protective factor)
- Missing data should return null, not 0 (0 implies negative data, null implies no data)
- First session is heavily weighted (0.25) so accuracy here is critical
- Tutor switches are negative signal but some switching is normal

---

### PR 2.3: Comprehensive Churn Risk Assessment

**Goal:** Combine all factors with weights to calculate final churn risk score

**Read these files first:**
- `/Users/mike/gauntlet/tutor-dashboard/services/churn-service.ts` (completed PR 2.1-2.2)
- `/Users/mike/gauntlet/tutor-dashboard/docs/project_overview.md` (lines 516-540 for ChurnFactor interface)

**Tasks:**
- [ ] Extend `/Users/mike/gauntlet/tutor-dashboard/services/churn-service.ts`
- [ ] Implement `calculateChurnRiskAssessment(studentId: string)`:
  - Fetch current weights using getCurrentChurnWeights()
  - Calculate all factor values using functions from PR 2.2
  - For each factor:
    - Get normalized_score (0-10, higher = lower risk)
    - Calculate impact: 'positive' if score >= 7, 'negative' if score < 5, 'neutral' otherwise
    - Calculate contribution_to_risk: weight * (10 - normalized_score) / 10
  - Sum all contribution_to_risk values = total_risk_score (0-1 scale)
  - Determine risk_level:
    - Low: risk_score < 0.3
    - Medium: 0.3 <= risk_score < 0.6
    - High: risk_score >= 0.6
  - Separate factors into risk_factors (negative impact) and protective_factors (positive impact)
  - Return `ChurnRiskAssessment` interface
- [ ] Implement `identifyChurnRiskFactors(assessment: ChurnRiskAssessment)`:
  - Filter factors where impact = 'negative'
  - Sort by contribution_to_risk DESC
  - Return top 5 risk factors with descriptions
  - Example: "First session satisfaction was 3.5/10 (contributes 12% to churn risk)"
- [ ] Implement `identifyProtectiveFactors(assessment: ChurnRiskAssessment)`:
  - Filter factors where impact = 'positive'
  - Sort by contribution_to_risk ASC (protective factors reduce risk)
  - Return top 3 protective factors with descriptions
  - Example: "Good tutor match (avg session score: 7.8/10)"
- [ ] Define TypeScript interfaces:
  - `ChurnRiskAssessment` (complete risk analysis)
  - `ChurnFactor` (individual factor with all metadata)
  - `ProtectiveFactor` (positive indicators)
  - `RiskLevel` ('low' | 'medium' | 'high')

**What to Test:**
1. Build project - verify TypeScript passes
2. Call calculateChurnRiskAssessment with student who has complete data - verify all factors present
3. Verify risk_score is between 0 and 1
4. Call identifyChurnRiskFactors - verify returns only negative-impact factors
5. Call identifyProtectiveFactors - verify returns only positive-impact factors
6. Test with student at different risk levels (manipulate data) - verify correct risk_level assigned
7. Manually verify math: sum of (weight * contribution) for all factors

**Files Changed:**
- `/Users/mike/gauntlet/tutor-dashboard/services/churn-service.ts` - Add comprehensive risk assessment

**Notes:**
- ChurnFactor.contribution_to_risk represents how much this factor contributes to RISK (positive number)
- Protective factors have low contribution_to_risk (they reduce risk)
- Risk factors have high contribution_to_risk (they increase risk)
- Algorithm must handle missing factors gracefully: redistribute weight across available factors
- Display formula in UI: contribution_to_risk = weight × (10 - normalized_score) / 10

---

## Phase 3: Student Detail Page Components

**Estimated Time:** 4-5 hours

This phase creates domain-specific components for the Student Detail Page. These components consume data from services and render the six main sections.

### PR 3.1: Student Header Component

**Goal:** Create header component with student info and status badge

**Read these files first:**
- `/Users/mike/gauntlet/tutor-dashboard/components/ui/badge.tsx` (from Phase 3)
- `/Users/mike/gauntlet/tutor-dashboard/components/ui/card.tsx` (from Phase 3)
- `/Users/mike/gauntlet/tutor-dashboard/lib/db/types.ts`
- `/Users/mike/gauntlet/tutor-dashboard/docs/project_overview.md` (lines 202-206 for header layout)

**Tasks:**
- [ ] Create NEW: `/Users/mike/gauntlet/tutor-dashboard/components/students/student-header.tsx`
- [ ] Implement `StudentHeader` component:
  - Props: student (StudentDetailProfile), stats (StudentStats)
  - Display anonymized student ID (e.g., "Student #STU-12345")
  - Display status badge with color coding:
    - Active: green/success variant
    - At Risk: yellow/warning variant
    - Churned: red/destructive variant
  - Display enrolled_since date
  - Display parent contact button (if parent_email exists)
  - Show quick stats row:
    - Total Sessions
    - Current Tutor name (or "No active tutor")
    - Subjects interested (comma-separated)
  - Responsive layout: stacked on mobile, horizontal on desktop
  - Use Card component as container
- [ ] Add status badge helper function `getStatusBadgeVariant(status)`:
  - Returns appropriate Badge variant for each status
  - Handles 'active' | 'churned' | 'paused' | 'at_risk'
- [ ] Style with Tailwind following existing page patterns
- [ ] Mark as client component if needed (for contact button interaction)

**What to Test:**
1. Build project - verify no errors
2. Render StudentHeader with Active student - verify green badge
3. Render StudentHeader with Churned student - verify red badge, churned date shown
4. Render StudentHeader with student who has parent_email - verify contact button appears
5. Test responsive layout on narrow viewport - verify stacks properly

**Files Changed:**
- NEW: `/Users/mike/gauntlet/tutor-dashboard/components/students/student-header.tsx` - Student header component

**Notes:**
- Student IDs should be anonymized (don't show real names for privacy)
- "At Risk" is calculated status (risk_level = 'medium' or 'high'), not stored in DB
- Contact button can be placeholder for MVP (just shows email or opens mailto:)
- Follow tutor-header component patterns if one exists from Phase 4.3

---

### PR 3.2: Churn Risk Assessment Panel Component

**Goal:** Create prominent churn risk display with factors breakdown

**Read these files first:**
- `/Users/mike/gauntlet/tutor-dashboard/components/ui/card.tsx`
- `/Users/mike/gauntlet/tutor-dashboard/components/ui/badge.tsx`
- `/Users/mike/gauntlet/tutor-dashboard/components/ui/metric-card.tsx` (from Phase 3)
- `/Users/mike/gauntlet/tutor-dashboard/services/churn-service.ts` (completed Phase 2)
- `/Users/mike/gauntlet/tutor-dashboard/docs/project_overview.md` (lines 207-217 for panel layout)

**Tasks:**
- [ ] Create NEW: `/Users/mike/gauntlet/tutor-dashboard/components/students/churn-risk-panel.tsx`
- [ ] Implement `ChurnRiskPanel` component:
  - Props: assessment (ChurnRiskAssessment), studentId (string)
  - Section 1: Risk Level Header
    - Large, prominent risk level badge (Low/Medium/High with colors)
    - Risk score percentage (0-100%, derived from risk_score * 100)
    - Visual indicator (color-coded border or background)
  - Section 2: Risk Factors (red/orange list)
    - Title: "Risk Factors" with warning icon
    - List each negative-impact factor:
      - Factor name (human-readable)
      - Factor value (e.g., "First session: 3.5/10")
      - Weight in algorithm (e.g., "Weight: 25%")
      - Contribution to risk (e.g., "Contributes 12% to overall risk")
    - Sort by contribution DESC
    - Show top 5 factors max
  - Section 3: Protective Factors (green list)
    - Title: "Protective Factors" with checkmark icon
    - List each positive-impact factor:
      - Factor name
      - Factor value (e.g., "Avg session score: 7.8/10")
      - How it helps (e.g., "Reduces risk by 5%")
    - Sort by positive impact
    - Show top 3 factors max
  - Section 4: Action Link
    - Link to detailed risk breakdown (modal or separate page)
    - Text: "View detailed risk analysis →"
  - Use Card component with elevated shadow for prominence
- [ ] Add helper function `formatFactorDescription(factor: ChurnFactor)`:
  - Converts factor category to human-readable text
  - Examples:
    - first_session_satisfaction → "First Session Experience"
    - sessions_completed → "Session History"
    - tutor_consistency → "Tutor Relationship Stability"
- [ ] Add helper function `getRiskLevelColor(level: RiskLevel)`:
  - Returns Tailwind color classes for each level
  - Low: green-500, Medium: yellow-500, High: red-500
- [ ] Style with emphasis on risk level (visual hierarchy)
- [ ] Mark as client component ('use client') for potential interactivity

**What to Test:**
1. Build project - verify compilation
2. Render ChurnRiskPanel with high-risk student - verify red color, risk factors prominent
3. Render ChurnRiskPanel with low-risk student - verify green color, protective factors shown
4. Verify factor contributions sum to ~100% (accounting for rounding)
5. Check that top factors are displayed (sorted correctly)
6. Test with student missing some factors - verify handles gracefully

**Files Changed:**
- NEW: `/Users/mike/gauntlet/tutor-dashboard/components/students/churn-risk-panel.tsx` - Churn risk assessment panel

**Notes:**
- This is THE MOST IMPORTANT component on the page (per project_overview.md)
- Placement should be high on page, above session history
- Risk factors should be actionable (admins can intervene based on these)
- Protective factors help identify what's working well
- Use icons from lucide-react: AlertTriangle (risk), CheckCircle (protective)

---

### PR 3.3: Student Stats Grid Component

**Goal:** Create overview grid of key student metrics

**Read these files first:**
- `/Users/mike/gauntlet/tutor-dashboard/components/ui/metric-card.tsx` (from Phase 3)
- `/Users/mike/gauntlet/tutor-dashboard/services/student-service.ts` (from Phase 2)
- `/Users/mike/gauntlet/tutor-dashboard/docs/project_overview.md` (lines 218-223 for stats grid)

**Tasks:**
- [ ] Create NEW: `/Users/mike/gauntlet/tutor-dashboard/components/students/student-stats-grid.tsx`
- [ ] Implement `StudentStatsGrid` component:
  - Props: stats (StudentStats)
  - Display 6 metric cards in responsive grid (3 cols desktop, 2 cols tablet, 1 col mobile):
    1. Sessions Completed (number, with icon)
    2. Avg Session Score (0-10, color-coded badge)
    3. Avg Student Engagement (0-10, color-coded)
    4. Tutors Worked With (count)
    5. Rebook Rate (percentage)
    6. Avg Satisfaction Rating (1-5 stars, if available)
  - Use MetricCard component from Phase 3
  - Handle missing data: show "N/A" for null values
  - Add appropriate icons from lucide-react for each metric
  - Color code scores using score-badge logic (red < 5, yellow 5-7, green > 7)
- [ ] Add helper function `formatStatValue(value, type)`:
  - Formats numbers appropriately (percentage, rating, count, score)
  - Handles null values → "N/A"
- [ ] Style with consistent spacing using Tailwind grid
- [ ] Server component (no interactivity needed)

**What to Test:**
1. Build project - verify no errors
2. Render StudentStatsGrid with complete stats - verify all 6 metrics display
3. Render with student who has NO feedback - verify "Avg Satisfaction Rating" shows "N/A"
4. Verify responsive grid: check on mobile, tablet, desktop widths
5. Verify color coding matches score thresholds

**Files Changed:**
- NEW: `/Users/mike/gauntlet/tutor-dashboard/components/students/student-stats-grid.tsx` - Student stats overview grid

**Notes:**
- Reuse MetricCard component from Phase 3 (should already be built)
- Stats should be read-only, no interactivity
- Grid should be below churn risk panel but above session history
- Icons suggestions: BookOpen (sessions), Target (score), Activity (engagement), Users (tutors), Repeat (rebook), Star (rating)

---

### PR 3.4: Student Session History Component

**Goal:** Create session history table from student perspective

**Read these files first:**
- `/Users/mike/gauntlet/tutor-dashboard/components/ui/data-table.tsx` (from Phase 3)
- `/Users/mike/gauntlet/tutor-dashboard/components/ui/badge.tsx`
- `/Users/mike/gauntlet/tutor-dashboard/services/session-service.ts` (from Phase 2)
- `/Users/mike/gauntlet/tutor-dashboard/docs/project_overview.md` (lines 225-229 for session history layout)

**Tasks:**
- [ ] Create NEW: `/Users/mike/gauntlet/tutor-dashboard/components/students/student-session-history.tsx`
- [ ] Implement `StudentSessionHistory` component:
  - Props: sessions (StudentSessionHistoryItem[]), tutorSwitches (TutorSwitch[])
  - Use DataTable component from Phase 3
  - Define columns:
    1. Date (scheduled_start, formatted)
    2. Tutor (tutor name, with link to tutor detail page)
    3. Subject (subject name)
    4. Session # (session_number for this tutor-student pair)
    5. Score (overall_session_score, color-coded badge)
    6. Rating (student_satisfaction_rating if available, star display)
    7. Status (completed/no-show/cancelled, badge)
  - Highlight tutor switch rows:
    - If session is first with new tutor (detected via tutorSwitches)
    - Add visual indicator (icon or border color)
    - Tooltip: "Switched from [PrevTutorName] to [NewTutorName]"
  - Enable sorting by date, score, rating
  - Limit to 50 recent sessions, with "Load more" button
  - Link each row to session detail page
- [ ] Add helper function `isTutorSwitchSession(sessionId, tutorSwitches)`:
  - Checks if this session represents a tutor switch
  - Returns boolean
- [ ] Add helper function `formatSessionDate(date)`:
  - Format date as "MMM dd, yyyy" using date-fns
- [ ] Mark as client component if using interactive table features
- [ ] Style with consistent table patterns

**What to Test:**
1. Build project - verify compilation
2. Render StudentSessionHistory with sessions from multiple tutors - verify tutor column displays names
3. Render with student who switched tutors - verify switch indicator appears
4. Test sorting by date, score - verify DataTable sorting works
5. Click row - verify navigates to session detail page
6. Test with student who has NO ratings - verify rating column shows "N/A"

**Files Changed:**
- NEW: `/Users/mike/gauntlet/tutor-dashboard/components/students/student-session-history.tsx` - Session history table

**Notes:**
- Tutor switches are important for churn analysis (switching can be positive or negative)
- First sessions with each tutor should be visually distinct (they're weighted heavily)
- Use Link from next/link for navigation to /sessions/[sessionId]
- DataTable should handle empty state ("No sessions yet")
- Consider adding filter by tutor or date range for students with many sessions

---

### PR 3.5: Tutor History Component

**Goal:** Create component showing all tutors student has worked with

**Read these files first:**
- `/Users/mike/gauntlet/tutor-dashboard/components/ui/card.tsx`
- `/Users/mike/gauntlet/tutor-dashboard/services/tutor-service.ts` (from Phase 2)
- `/Users/mike/gauntlet/tutor-dashboard/docs/project_overview.md` (lines 230-234 for tutor history)

**Tasks:**
- [ ] Create NEW: `/Users/mike/gauntlet/tutor-dashboard/components/students/tutor-history-list.tsx`
- [ ] Implement `TutorHistoryList` component:
  - Props: tutorHistory (StudentTutorHistory[]), currentTutorId (string | null)
  - Display each tutor as a card with:
    - Tutor name (linked to tutor detail page)
    - Badge: "Current" if matches currentTutorId
    - Sessions together count
    - Avg session score for this pair (color-coded)
    - Avg student satisfaction (if available)
    - Date range: "March 2024 - Present" or "Jan - Feb 2024"
    - Rebook rate with this specific tutor
  - Order chronologically (earliest tutor first)
  - Visual indicator for current tutor (highlighted card or border)
  - Show compatibility score if available
- [ ] Add helper function `formatDateRange(firstDate, lastDate)`:
  - Returns formatted string like "Jan 2024 - Present"
  - Handles ongoing relationships (lastDate is recent)
- [ ] Add helper function `getTutorPerformanceIndicator(avgScore)`:
  - Returns icon and color for performance
  - Great (>8), Good (7-8), Needs Work (<7)
- [ ] Style as vertical list of cards with subtle shadows
- [ ] Server component (no interactivity)

**What to Test:**
1. Build project - verify no errors
2. Render TutorHistoryList with student who had 3 tutors - verify all 3 shown
3. Render with current tutor - verify "Current" badge appears
4. Verify chronological order (earliest first)
5. Click tutor name - verify navigates to /tutors/[tutorId]
6. Test with student who only worked with 1 tutor - verify single card

**Files Changed:**
- NEW: `/Users/mike/gauntlet/tutor-dashboard/components/students/tutor-history-list.tsx` - Tutor relationship history

**Notes:**
- This helps identify if student needs better tutor match (compatibility issues)
- Frequent switching is a churn risk factor
- Highlight if student performed much better with one tutor vs others
- Link tutor names to tutor detail pages for deeper investigation
- Consider showing "Best Match" badge for highest-performing tutor

---

### PR 3.6: Churn Management Component

**Goal:** Create component for post-churn analysis (only shown if student churned)

**Read these files first:**
- `/Users/mike/gauntlet/tutor-dashboard/components/ui/card.tsx`
- `/Users/mike/gauntlet/tutor-dashboard/lib/db/schema/students.ts`
- `/Users/mike/gauntlet/tutor-dashboard/docs/project_overview.md` (lines 235-240 for churn management)

**Tasks:**
- [ ] Create NEW: `/Users/mike/gauntlet/tutor-dashboard/components/students/churn-management-panel.tsx`
- [ ] Implement `ChurnManagementPanel` component:
  - Props: student (StudentDetailProfile with churn data), churnReasons (ChurnReasonType[])
  - Only render if student.status === 'churned'
  - Display sections:
    1. Churn Date (formatted date)
    2. Recorded Reasons (from student_churn_reasons table):
       - List all reasons as badges
       - Color-code by reason type (poor_first_session is critical, price_concerns is neutral, etc.)
    3. Survey Response (freeform text if available):
       - Display student.churn_survey_response in quote block
       - Show "No survey response" if null
    4. Algorithm Learning Event:
       - Link to algorithm dashboard to see how this case informed weight adjustments
       - Text: "This churn case was used to refine the prediction algorithm →"
       - Link to /settings/algorithm or modal
  - Use Card with red/muted border to indicate churned status
  - Muted colors overall (this is historical data)
- [ ] Add helper function `getChurnReasonLabel(reason)`:
  - Converts enum to human-readable text
  - Examples: poor_first_session → "Poor First Session", tutor_mismatch → "Tutor Mismatch"
- [ ] Add helper function `getChurnReasonColor(reason)`:
  - Returns badge variant based on reason severity
  - Critical issues (poor_first_session, tutor_mismatch) = destructive
  - External factors (completed_goals, personal_circumstances) = secondary
- [ ] Server component (mostly static display)

**What to Test:**
1. Build project - verify compilation
2. Render with churned student who has reasons - verify reasons display as badges
3. Render with churned student who has survey response - verify quote block shows text
4. Render with active student - verify component doesn't render (or returns null)
5. Verify churn date formatting

**Files Changed:**
- NEW: `/Users/mike/gauntlet/tutor-dashboard/components/students/churn-management-panel.tsx` - Post-churn analysis

**Notes:**
- This component is for retrospective analysis (learning from churn)
- Link to algorithm dashboard (Phase 4.6) for weight adjustments
- Multiple churn reasons can exist (student_churn_reasons is junction table)
- Survey responses are valuable for manual review and algorithm tuning
- Consider adding "Re-activate Student" button (out of scope for MVP)

---

## Phase 4: Student Detail Page Assembly

**Estimated Time:** 3-4 hours

This phase assembles all components into the final page with proper data fetching and layout.

### PR 4.1: Student Detail Page Implementation

**Goal:** Create complete student detail page with all sections integrated

**Read these files first:**
- All component files from Phase 3 (PR 3.1-3.6)
- `/Users/mike/gauntlet/tutor-dashboard/services/student-service.ts` (completed)
- `/Users/mike/gauntlet/tutor-dashboard/services/churn-service.ts` (completed)
- `/Users/mike/gauntlet/tutor-dashboard/app/dashboard/page.tsx` (for pattern reference)
- `/Users/mike/gauntlet/tutor-dashboard/docs/project_overview.md` (lines 196-240 for full layout)

**Tasks:**
- [ ] Create NEW: `/Users/mike/gauntlet/tutor-dashboard/app/students/[studentId]/page.tsx`
- [ ] Implement page as Server Component:
  - Extract studentId from params
  - Fetch all required data using service functions:
    - Student profile: getStudentDetailById(studentId)
    - Student stats: getStudentStats(studentId)
    - Churn risk: calculateChurnRiskAssessment(studentId)
    - Session history: getStudentSessionHistory(studentId)
    - Tutor switches: getStudentTutorSwitches(studentId)
    - Tutor history: getStudentTutorHistory(studentId)
    - Current tutor: getStudentCurrentTutor(studentId)
    - Churn reasons (if churned): fetch from student_churn_reasons
  - Handle loading state
  - Handle error state (student not found)
  - Pass data to components
- [ ] Implement page layout with 6 sections:
  1. StudentHeader (top)
  2. Two-column layout:
     - Left column (wider, 2/3):
       - ChurnRiskPanel (prominent)
       - StudentStatsGrid
       - StudentSessionHistory
     - Right column (narrower, 1/3):
       - TutorHistoryList
       - ChurnManagementPanel (if churned)
  3. Responsive: stack columns on mobile
- [ ] Add page title and back button:
  - Title: "Student Details"
  - Back button: "← Back to Students" (links to /students list page)
- [ ] Add metadata for SEO:
  - Title: "Student STU-12345 | Tutor Dashboard"
  - Description: "View student performance and churn risk analysis"
- [ ] Style with consistent spacing and section dividers
- [ ] Add loading skeleton (Suspense boundary)
- [ ] Add error boundary for failed data fetches

**What to Test:**
1. Build project - verify no compilation errors
2. Navigate to /students/[validStudentId] - verify page loads with all sections
3. Verify churn risk panel is prominent and above session history
4. Verify stats grid shows all 6 metrics
5. Verify session history table loads and is sortable
6. Verify tutor history shows all tutors worked with
7. Navigate to /students/[invalidId] - verify error handling (404 or error page)
8. Test with churned student - verify ChurnManagementPanel appears
9. Test with active student - verify ChurnManagementPanel doesn't appear
10. Test responsive layout on mobile viewport - verify columns stack
11. Click tutor name in history - verify navigates to tutor detail page
12. Click session in history - verify navigates to session detail page

**Files Changed:**
- NEW: `/Users/mike/gauntlet/tutor-dashboard/app/students/[studentId]/page.tsx` - Complete student detail page

**Notes:**
- Follow Next.js 15 App Router patterns (Server Components by default)
- Use Suspense for loading states
- Error boundaries for graceful error handling
- All data fetching in Server Component (no client-side fetching)
- Pass data down to components via props
- Layout should match visual hierarchy from project_overview.md
- Consider caching strategy for expensive churn calculations (React cache or Drizzle query caching)

---

### PR 4.2: Navigation Integration & Students List Page

**Goal:** Create students list page and integrate navigation from dashboard

**Read these files first:**
- `/Users/mike/gauntlet/tutor-dashboard/app/dashboard/page.tsx`
- `/Users/mike/gauntlet/tutor-dashboard/app/students/[studentId]/page.tsx` (completed PR 4.1)
- `/Users/mike/gauntlet/tutor-dashboard/services/student-service.ts`

**Tasks:**
- [ ] Create NEW: `/Users/mike/gauntlet/tutor-dashboard/app/students/page.tsx`
- [ ] Implement students list page:
  - Fetch all students with basic info
  - Display in sortable/filterable table:
    - Student ID (anonymized)
    - Enrolled Since
    - Status (badge)
    - Churn Risk Level (badge)
    - Sessions Completed
    - Current Tutor
    - Avg Session Score
  - Support filters:
    - Status: All / Active / At Risk / Churned
    - Sort by: Enrolled Date, Risk Level, Sessions, Score
  - Use DataTable component from Phase 3
  - Link each row to /students/[studentId]
  - Show count: "Showing X of Y students"
- [ ] Add to main navigation:
  - Update layout.tsx or navigation component
  - Add "Students" link to nav bar (between Tutors and Sessions)
  - Active state when on /students routes
- [ ] Add quick links from dashboard:
  - In dashboard, add "At Risk Students" card
  - Shows count of students with risk_level = 'medium' or 'high'
  - Click to view filtered students list (/students?filter=at-risk)
- [ ] Implement filter state:
  - Use URL search params for filters (?status=churned)
  - Allows bookmarking and sharing filtered views
  - Apply filters server-side before rendering
- [ ] Add page metadata

**What to Test:**
1. Build project - verify no errors
2. Navigate to /students - verify list of all students loads
3. Test filters - apply "At Risk" filter, verify only high/medium risk students shown
4. Test sorting - sort by risk level, verify correct order
5. Click student row - verify navigates to detail page
6. Check navigation bar - verify "Students" link is present and active
7. From dashboard, click "At Risk Students" - verify navigates to filtered list
8. Test URL params - manually go to /students?status=churned, verify filter applied

**Files Changed:**
- NEW: `/Users/mike/gauntlet/tutor-dashboard/app/students/page.tsx` - Students list page
- `/Users/mike/gauntlet/tutor-dashboard/app/layout.tsx` or navigation component - Add Students nav link
- `/Users/mike/gauntlet/tutor-dashboard/app/dashboard/page.tsx` - Add at-risk students card (optional)

**Notes:**
- Students list is secondary to detail page (may be lower priority for MVP)
- Focus on making detail page fully functional first
- List page can be simple table initially, enhanced later
- At-risk filtering is most important (helps admins prioritize interventions)
- Consider pagination if student count grows large (100+ students)

---

## Phase 5: Testing & Refinement

**Estimated Time:** 2-3 hours

This phase focuses on end-to-end testing, edge case handling, and performance optimization.

### PR 5.1: Comprehensive Testing & Edge Cases

**Goal:** Test all scenarios and handle edge cases gracefully

**Tasks:**
- [ ] Test with students at different stages:
  - Brand new student (0 sessions)
  - Student with 1 session (first session outcome critical)
  - Student with multiple sessions, single tutor
  - Student with multiple sessions, multiple tutors
  - Churned student with full data
  - Churned student with partial data
- [ ] Test data availability scenarios:
  - Sessions without feedback (no ratings)
  - Sessions without video/screen metrics
  - Student with no audio metrics (shouldn't happen, but handle)
  - Student with NULL values in optional fields
- [ ] Test churn risk calculation edge cases:
  - All factors available vs some missing
  - Verify weight redistribution when factors unavailable
  - Student with contradictory signals (high score but low engagement)
- [ ] Test error handling:
  - Invalid student ID (404 page)
  - Database connection failure (error boundary)
  - Service function throws error (graceful degradation)
- [ ] Performance testing:
  - Measure page load time with 50+ sessions
  - Check query efficiency (N+1 query problems)
  - Verify caching works for churn calculations
  - Test with multiple concurrent users
- [ ] Accessibility testing:
  - Keyboard navigation works
  - Screen reader compatibility
  - Color contrast meets WCAG AA standards
  - Focus indicators visible
- [ ] Create test data script:
  - Add seed data for various student scenarios
  - Include edge cases in seed data
  - Script: `/Users/mike/gauntlet/tutor-dashboard/scripts/seed-students-test.ts`

**What to Test:**
1. Run through all test scenarios listed above
2. Verify no crashes or unhandled errors
3. Verify performance is acceptable (<2s page load)
4. Verify accessibility with screen reader
5. Check console for errors or warnings
6. Verify all calculations match expected values (manual spot checks)

**Files Changed:**
- Various components and services (bug fixes)
- NEW: `/Users/mike/gauntlet/tutor-dashboard/scripts/seed-students-test.ts` - Test data generation

**Notes:**
- Focus on graceful degradation (missing data doesn't break page)
- Performance is critical for churn calculations (cache aggressively)
- Error boundaries prevent entire page from crashing
- Loading states prevent confusion during data fetch
- Consider adding Sentry or error logging for production

---

### PR 5.2: Documentation & Code Cleanup

**Goal:** Document the student detail page implementation and clean up code

**Tasks:**
- [ ] Update `/Users/mike/gauntlet/tutor-dashboard/docs/database_schema.md`:
  - Add notes about student-related queries
  - Document churn algorithm weight versioning
- [ ] Create component documentation:
  - Add JSDoc comments to all component props
  - Document expected data shapes
  - Add usage examples in comments
- [ ] Code cleanup:
  - Remove console.logs used during development
  - Remove unused imports
  - Fix any ESLint warnings
  - Ensure consistent formatting (prettier)
- [ ] Service function documentation:
  - Add JSDoc comments to all service functions
  - Document return types and edge cases
  - Add examples for complex calculations (churn risk)
- [ ] Performance notes:
  - Document caching strategy
  - Note expensive queries that may need optimization
  - Suggest future improvements (materialized views, etc.)
- [ ] Update `/Users/mike/gauntlet/tutor-dashboard/docs/general_project_plan.md`:
  - Mark Phase 4.5 as complete
  - Note any deviations from original plan
  - Add completion date

**What to Test:**
1. Build project - verify no errors or warnings
2. Run linter - verify no issues
3. Check all files for consistent formatting
4. Verify documentation is clear and helpful

**Files Changed:**
- All student-related components and services (documentation added)
- `/Users/mike/gauntlet/tutor-dashboard/docs/database_schema.md` - Updated with student queries
- `/Users/mike/gauntlet/tutor-dashboard/docs/general_project_plan.md` - Mark phase complete

**Notes:**
- Good documentation helps future development (Phase 4.6 and beyond)
- Clean code is easier to maintain and extend
- JSDoc comments enable better IDE autocomplete
- Consider adding Storybook stories for components (future enhancement)

---

## Completion Checklist

When all PRs are complete, verify:

- [ ] Student detail page accessible at /students/[studentId]
- [ ] All 6 sections render correctly (header, risk panel, stats, session history, tutor history, churn management)
- [ ] Churn risk calculation uses weighted algorithm from database
- [ ] Risk factors and protective factors display with contributions
- [ ] Session history highlights tutor switches and first sessions
- [ ] Tutor history shows all tutors with per-tutor performance
- [ ] Churn management panel only appears for churned students
- [ ] Students list page exists at /students with filtering
- [ ] Navigation includes Students link
- [ ] Page handles edge cases gracefully (missing data, errors)
- [ ] Performance is acceptable (<2s load time)
- [ ] Code is documented and clean
- [ ] Tests pass for various student scenarios

---

## Key Files Reference

**Service Layer:**
- `/Users/mike/gauntlet/tutor-dashboard/services/student-service.ts` - Student data access
- `/Users/mike/gauntlet/tutor-dashboard/services/session-service.ts` - Session queries
- `/Users/mike/gauntlet/tutor-dashboard/services/tutor-service.ts` - Tutor relationships
- `/Users/mike/gauntlet/tutor-dashboard/services/churn-service.ts` - Churn risk calculations

**Components:**
- `/Users/mike/gauntlet/tutor-dashboard/components/students/student-header.tsx`
- `/Users/mike/gauntlet/tutor-dashboard/components/students/churn-risk-panel.tsx`
- `/Users/mike/gauntlet/tutor-dashboard/components/students/student-stats-grid.tsx`
- `/Users/mike/gauntlet/tutor-dashboard/components/students/student-session-history.tsx`
- `/Users/mike/gauntlet/tutor-dashboard/components/students/tutor-history-list.tsx`
- `/Users/mike/gauntlet/tutor-dashboard/components/students/churn-management-panel.tsx`

**Pages:**
- `/Users/mike/gauntlet/tutor-dashboard/app/students/[studentId]/page.tsx` - Detail page
- `/Users/mike/gauntlet/tutor-dashboard/app/students/page.tsx` - List page

**Database Schema:**
- `/Users/mike/gauntlet/tutor-dashboard/lib/db/schema/students.ts`
- `/Users/mike/gauntlet/tutor-dashboard/lib/db/schema/sessions.ts`
- `/Users/mike/gauntlet/tutor-dashboard/lib/db/schema/churn.ts`

**Types:**
- `/Users/mike/gauntlet/tutor-dashboard/lib/db/types.ts`

---

## Dependencies on Other Phases

**Must be complete before starting:**
- Phase 4.1: Platform Metrics & Data Layer (service functions)
- Phase 3: Reusable Components (UI components)

**Provides foundation for:**
- Phase 4.6: Algorithm Refinement Dashboard (uses churn calculations)
- Phase 5: Cross-feature integration (navigation, data consistency)

**Related phases (can be parallel):**
- Phase 4.2: Admin Dashboard (may link to at-risk students)
- Phase 4.3: Tutor Detail Page (links to tutors from history)
- Phase 4.4: Session Detail Page (links from session history)

---

## Success Criteria

**Functional Requirements:**
✓ Admins can view complete student profile with churn risk assessment
✓ Churn risk calculation uses weighted algorithm with factor breakdown
✓ Risk factors and protective factors are clearly displayed with contributions
✓ Session history shows all sessions with tutor context
✓ Tutor history tracks all tutor relationships and performance
✓ Churned students show post-mortem analysis panel
✓ Students list page allows filtering by risk level

**Technical Requirements:**
✓ All data fetched via service layer (no direct DB queries in components)
✓ Page loads in <2 seconds with 50+ sessions
✓ Missing data handled gracefully (no crashes)
✓ Error boundaries prevent full-page failures
✓ Responsive design works on mobile, tablet, desktop
✓ Accessibility standards met (WCAG AA)

**Code Quality:**
✓ All components have TypeScript interfaces
✓ Service functions include JSDoc comments
✓ No ESLint errors or warnings
✓ Consistent code formatting
✓ Test data includes edge cases

---

**Phase 4.5 Estimated Total Time:** 16-21 hours

**Recommended Approach:** Complete phases sequentially (1 → 2 → 3 → 4 → 5), one PR at a time, with approval checkpoints between PRs.
