# Algorithm Refinement Dashboard - Implementation Tasks

## Context

Phase 4.6 implements the Algorithm Refinement Dashboard, a showcase feature that demonstrates the system's self-learning capability. This dashboard allows admins to view and adjust the churn prediction algorithm weights, see how the system learns from actual churn cases, and simulate the impact of weight changes on prediction accuracy.

The Algorithm Refinement Dashboard is built on top of the churn algorithm infrastructure already defined in the database schema (`churn_algorithm_weights` and `churn_weight_history` tables in `/Users/mike/gauntlet/tutor-dashboard/lib/db/schema/alerts.ts`). The current algorithm uses six factors to predict student churn risk, each with an assigned weight that must sum to 1.0:

- **first_session_satisfaction** (0.25) - How well the first session went
- **sessions_completed** (0.15) - Total number of sessions finished
- **follow_up_booking_rate** (0.20) - Percentage of sessions leading to rebooking
- **avg_session_score** (0.15) - Average overall session quality
- **tutor_consistency** (0.10) - Whether student has same tutor or switches frequently
- **student_engagement** (0.15) - Average engagement score across sessions

This dashboard has five main sections as specified in `/Users/mike/gauntlet/tutor-dashboard/docs/project_overview.md` (lines 242-292):

1. **Model Performance Summary** - Current accuracy, false positives/negatives, prediction counts
2. **Churn Prediction Factors & Weights** - Interactive sliders to adjust weights with real-time validation
3. **Recent Learning Events** - Chronological feed of churn cases that informed weight adjustments
4. **Before/After Comparison** - Modal showing retroactive accuracy impact of weight changes
5. **Case Study Modal** - Workflow for marking students as churned and learning from the case

**Key Design Principles:**
- Weights must always sum to exactly 1.0 (validated client-side and server-side)
- All weight changes are versioned and audited in `churn_weight_history` table
- Retroactive analysis runs against existing student data to project accuracy improvements
- The dashboard demonstrates AI learning without requiring actual ML models (uses rule-based calculations)
- Service layer handles all complex churn risk calculations
- UI provides clear before/after comparisons to justify weight adjustments

## Instructions for AI Agent

**Standard Workflow:**
1. **Read Phase**: Start each PR by reading all files listed in the "Read these files first" section to understand current implementation
2. **Implement Tasks**: Complete tasks in order, grouping related changes together
3. **Mark Complete**: Mark each task with [x] when finished
4. **Test**: Follow the "What to Test" section to validate your changes
5. **Summary**: Provide a completion summary listing files changed and key functionality added
6. **Wait for Approval**: Do not proceed to the next PR until the current one is approved

**File Organization:**
- Service functions go in `/Users/mike/gauntlet/tutor-dashboard/services/`
- Page components go in `/Users/mike/gauntlet/tutor-dashboard/app/dashboard/algorithm/`
- Reusable UI components go in `/Users/mike/gauntlet/tutor-dashboard/components/algorithm/`
- Use existing UI primitives from `/Users/mike/gauntlet/tutor-dashboard/components/ui/`

**Styling:**
- Use Tailwind CSS following the existing deep blue edu-tech theme
- Reference existing pages for color schemes and spacing patterns
- Ensure responsive design (mobile, tablet, desktop)

---

## Phase 1: Churn Algorithm Service Layer

**Estimated Time:** 4-5 hours

This phase creates the backend service functions for churn risk calculation, weight management, and retroactive analysis.

### PR 1.1: Core Churn Algorithm Service

**Goal:** Implement churn risk calculation engine and weight management functions

**Read these files first:**
- `/Users/mike/gauntlet/tutor-dashboard/lib/db/schema/alerts.ts` (lines 63-92 for churn tables)
- `/Users/mike/gauntlet/tutor-dashboard/lib/db/schema/students.ts`
- `/Users/mike/gauntlet/tutor-dashboard/lib/db/types.ts` (ChurnFactor interface and ChurnFactorCategory)
- `/Users/mike/gauntlet/tutor-dashboard/services/session-service.ts` (if exists from Phase 4.1)
- `/Users/mike/gauntlet/tutor-dashboard/lib/db/index.ts`

**Tasks:**
- [ ] Create NEW: `/Users/mike/gauntlet/tutor-dashboard/services/churn-service.ts`
- [ ] Implement `getCurrentAlgorithmWeights()`:
  - Query `churn_algorithm_weights` table for latest version
  - Group by version, get highest version number
  - Return object mapping factor_category to weight
  - Return all 6 factors with default weights if no records exist
- [ ] Implement `calculateStudentChurnRisk(studentId: string, weights?)`:
  - Fetch student's session history with metrics
  - Calculate each of the 6 factors from session data:
    - first_session_satisfaction: first session overall_score / 10
    - sessions_completed: normalize count (0-20+ sessions scale)
    - follow_up_booking_rate: count(follow_up_booked=true) / total sessions
    - avg_session_score: average of all session scores / 10
    - tutor_consistency: 1.0 if <=2 tutors, decreasing for more switches
    - student_engagement: average of engagement scores / 10
  - Apply weights to normalized factors
  - Sum weighted contributions to get churn_risk_score (0-1)
  - Return ChurnRiskResult interface with score, level (low/medium/high), and factor breakdown
- [ ] Implement `calculateChurnFactors(studentId: string, weights)`:
  - Helper function that returns array of ChurnFactor objects
  - Each factor includes: category, weight, value, normalized_score, impact, contribution_to_risk
  - Used for detailed risk panel display
- [ ] Implement `validateWeights(weights: Record<string, number>)`:
  - Check all 6 required factors are present
  - Verify each weight is between 0 and 1
  - Verify sum equals 1.0 (with 0.001 tolerance for floating point)
  - Return validation result with error messages
- [ ] Define TypeScript interfaces:
  - `AlgorithmWeights` - map of factor to weight value
  - `ChurnRiskResult` - score, level, factors array
  - `WeightValidationResult` - isValid boolean and errors array

**What to Test:**
1. Build project - verify no TypeScript errors
2. Call getCurrentAlgorithmWeights() - returns 6 factors summing to 1.0
3. Call calculateStudentChurnRisk() with test student - returns score between 0-1
4. Call validateWeights() with invalid sum - returns error
5. Verify factor calculations use available data only (handle missing sessions)

**Files Changed:**
- NEW: `/Users/mike/gauntlet/tutor-dashboard/services/churn-service.ts` - Churn risk calculation engine

**Notes:**
- If no sessions exist for student, return neutral risk (0.5) with explanation
- Normalize factors to 0-1 scale before applying weights
- first_session_satisfaction should heavily penalize scores < 6.5
- Use Drizzle's `desc()` and `limit(1)` to get first session efficiently

---

### PR 1.2: Weight Management & History Service

**Goal:** Create functions for updating weights and tracking version history

**Read these files first:**
- `/Users/mike/gauntlet/tutor-dashboard/services/churn-service.ts` (completed in PR 1.1)
- `/Users/mike/gauntlet/tutor-dashboard/lib/db/schema/alerts.ts`

**Tasks:**
- [ ] Update `/Users/mike/gauntlet/tutor-dashboard/services/churn-service.ts`
- [ ] Implement `updateAlgorithmWeights(newWeights, changedBy, changeReason, caseStudy?)`:
  - Validate weights using validateWeights()
  - Get current weights for old_weights field
  - Calculate accuracy_before using retroactive analysis
  - Increment version number
  - Insert new rows into churn_algorithm_weights (one per factor)
  - Insert history record into churn_weight_history
  - Calculate accuracy_after with new weights
  - Update history record with accuracy metrics
  - Return WeightUpdateResult with version number and accuracy delta
- [ ] Implement `getWeightHistory(limit = 10)`:
  - Query churn_weight_history ordered by created_at DESC
  - Include admin user name who made change
  - Parse old_weights and new_weights JSONB
  - Return array of WeightHistoryEntry objects
- [ ] Implement `getWeightHistoryById(historyId: string)`:
  - Fetch single history record with full details
  - Include case study session/student info if linked
  - Return detailed WeightHistoryDetail object
- [ ] Implement `calculateRetroactiveAccuracy(weights)`:
  - Get all students with known churn status (churned or active > 90 days)
  - Calculate predicted risk for each using provided weights
  - Compare prediction to actual outcome (threshold: >0.6 = predicted churn)
  - Count true positives, false positives, true negatives, false negatives
  - Return accuracy metrics object
- [ ] Define TypeScript interfaces:
  - `WeightUpdateResult` - version, accuracyBefore, accuracyAfter, delta
  - `WeightHistoryEntry` - summary view for list
  - `WeightHistoryDetail` - full view with case study
  - `AccuracyMetrics` - accuracy, precision, recall, f1Score, counts

**What to Test:**
1. Build project - verify no compilation errors
2. Call updateAlgorithmWeights() with valid weights - creates new version
3. Verify churn_algorithm_weights has 6 new rows for new version
4. Verify churn_weight_history has audit entry
5. Call getWeightHistory() - returns sorted history with user names
6. Call calculateRetroactiveAccuracy() - returns accuracy percentage

**Files Changed:**
- `/Users/mike/gauntlet/tutor-dashboard/services/churn-service.ts` - Add weight update and history functions

**Notes:**
- Use database transactions for updateAlgorithmWeights (all or nothing)
- Retroactive accuracy should use students with at least 3 sessions
- Store JSONB as properly typed objects, not strings
- Accuracy calculation is simulation - doesn't need perfect ML metrics for MVP

---

### PR 1.3: Learning Events & Case Study Service

**Goal:** Create functions for tracking and displaying learning events from churn cases

**Read these files first:**
- `/Users/mike/gauntlet/tutor-dashboard/services/churn-service.ts` (updated in PR 1.2)
- `/Users/mike/gauntlet/tutor-dashboard/lib/db/schema/students.ts`

**Tasks:**
- [ ] Update `/Users/mike/gauntlet/tutor-dashboard/services/churn-service.ts`
- [ ] Implement `getLearningEvents(limit = 20)`:
  - Query churn_weight_history with student/session joins
  - Filter to entries with case_study_student_id (actual learning cases)
  - Include student churn survey response
  - Calculate predicted vs actual outcome
  - Order by created_at DESC
  - Return array of LearningEvent objects
- [ ] Implement `createCaseStudy(studentId, predictedRisk, actualOutcome, surveyResponse?)`:
  - Fetch student data and calculate what system predicted
  - Analyze prediction accuracy (was it correct?)
  - Generate AI-recommended weight adjustments based on which factors were wrong
  - Return CaseStudyRecommendation object with suggested weight changes
- [ ] Implement `applyCaseStudy(caseStudyId, acceptedWeights, adminId)`:
  - Validate and apply weight changes from case study
  - Link weight history to the case study student/session
  - Mark case study as applied
  - Return success result
- [ ] Implement `getRecentChurns(limit = 10)`:
  - Query students table where status = 'churned'
  - Include churn date, reasons, survey response
  - Calculate what the system predicted vs reality
  - Order by churned_date DESC
  - Return array of ChurnedStudent objects for case study workflow
- [ ] Define TypeScript interfaces:
  - `LearningEvent` - what system learned from a churn case
  - `CaseStudyRecommendation` - suggested weight adjustments with rationale
  - `ChurnedStudent` - student info with prediction comparison

**What to Test:**
1. Build project - verify no TypeScript errors
2. Call getLearningEvents() - returns learning cases with student context
3. Call createCaseStudy() with student who churned - generates weight recommendations
4. Verify recommendations make logical sense (e.g., increase first_session weight if bad first session led to churn)
5. Call getRecentChurns() - returns students marked as churned

**Files Changed:**
- `/Users/mike/gauntlet/tutor-dashboard/services/churn-service.ts` - Add learning events and case study functions

**Notes:**
- Case study recommendations should be rule-based, not actual ML
- If first session was bad (<6.5) and student churned, suggest increasing first_session_satisfaction weight
- If student had many sessions but churned, suggest increasing sessions_completed weight
- Keep recommendations simple and explainable for MVP

---

## Phase 2: Algorithm Dashboard UI Components

**Estimated Time:** 5-6 hours

This phase builds the reusable UI components for the algorithm dashboard.

### PR 2.1: Weight Slider Component

**Goal:** Create interactive weight adjustment sliders with real-time validation

**Read these files first:**
- `/Users/mike/gauntlet/tutor-dashboard/components/ui/slider.tsx` (if exists, otherwise use shadcn)
- `/Users/mike/gauntlet/tutor-dashboard/components/ui/card.tsx`
- `/Users/mike/gauntlet/tutor-dashboard/lib/db/types.ts` (ChurnFactorCategory)

**Tasks:**
- [ ] Install shadcn slider if not present: `npx shadcn@latest add slider`
- [ ] Create NEW: `/Users/mike/gauntlet/tutor-dashboard/components/algorithm/weight-slider.tsx`
- [ ] Build WeightSlider component:
  - Props: factor (category), weight (0-1), suggestedWeight?, onChange, disabled
  - Display factor name in readable format (e.g., "First Session Satisfaction")
  - Show current weight as percentage (0-100%)
  - Show suggested weight if provided (ghost/outline style)
  - Slider from 0 to 100 with step of 1
  - Live percentage display next to slider
  - Impact indicator badge (Low/Medium/High/Very High based on weight value)
  - Tooltip explaining what this factor measures
- [ ] Create NEW: `/Users/mike/gauntlet/tutor-dashboard/components/algorithm/weight-panel.tsx`
- [ ] Build WeightPanel component:
  - Props: weights (Record<string, number>), onWeightsChange, suggestedWeights?, disabled
  - Render WeightSlider for each of 6 factors
  - Calculate and display total weight sum at bottom
  - Show validation error if sum ≠ 1.0 (red text with error icon)
  - Show success state if sum = 1.0 (green checkmark)
  - Action buttons: "Apply Suggested", "Reset to Defaults", "Save Changes"
  - Disable save button if validation fails
  - Display delta from current weights (e.g., "+5% First Session, -3% Tutor Consistency")
- [ ] Define TypeScript interfaces for component props

**What to Test:**
1. Build project - verify no compilation errors
2. Render WeightSlider with weight=0.25 - shows 25% and correct slider position
3. Adjust slider - onChange fires with new value
4. Render WeightPanel with weights summing to 1.0 - shows success state
5. Adjust weights to sum > 1.0 - shows validation error
6. Click "Reset to Defaults" - weights return to 0.25, 0.15, 0.20, 0.15, 0.10, 0.15

**Files Changed:**
- NEW: `/Users/mike/gauntlet/tutor-dashboard/components/algorithm/weight-slider.tsx` - Individual factor slider
- NEW: `/Users/mike/gauntlet/tutor-dashboard/components/algorithm/weight-panel.tsx` - Full weight adjustment panel

**Notes:**
- Use Tailwind color classes for validation states (red-500 for error, green-500 for success)
- Impact levels: Very High (>0.20), High (0.15-0.20), Medium (0.10-0.15), Low (<0.10)
- Factor name mapping: use human-readable labels like "First Session Satisfaction" not "first_session_satisfaction"
- Suggested weights should be visually distinct (lighter opacity or different color)

---

### PR 2.2: Model Performance Summary Card

**Goal:** Display current algorithm accuracy and prediction statistics

**Read these files first:**
- `/Users/mike/gauntlet/tutor-dashboard/components/ui/card.tsx`
- `/Users/mike/gauntlet/tutor-dashboard/components/ui/badge.tsx`

**Tasks:**
- [ ] Create NEW: `/Users/mike/gauntlet/tutor-dashboard/components/algorithm/performance-summary.tsx`
- [ ] Build PerformanceSummary component:
  - Props: accuracyMetrics (AccuracyMetrics from service)
  - Display in card layout with title "Model Performance Summary"
  - Show large percentage for current accuracy (e.g., "73.5% Accurate")
  - Show trend indicator if accuracy improved/declined vs previous version
  - Grid of 4 metrics:
    - Total Predictions Made
    - False Positives (predicted churn but didn't) - warning color
    - False Negatives (didn't predict churn but did) - critical color
    - True Positives (correctly predicted churn) - success color
  - Each metric shows count and percentage
  - Small info tooltips explaining what each metric means
  - Link to "View Detailed Analysis" (future feature, just styled text for now)
- [ ] Add visual flourishes:
  - Use large bold font for accuracy percentage
  - Color-coded badges for metric counts
  - Subtle background gradient or border accent
  - Icon for each metric type

**What to Test:**
1. Build project - verify no compilation errors
2. Render component with sample metrics - displays all 4 metrics
3. Verify percentages calculate correctly (e.g., false positive % = FP / total predictions)
4. Check responsive layout on mobile - grid should stack vertically
5. Hover over tooltips - see explanations

**Files Changed:**
- NEW: `/Users/mike/gauntlet/tutor-dashboard/components/algorithm/performance-summary.tsx` - Model accuracy display

**Notes:**
- False negatives are most critical (missed churns) - use red/critical styling
- False positives are concerning but less critical - use orange/warning styling
- Accuracy percentage should be prominent and easy to read
- Use lucide-react icons for visual enhancement

---

### PR 2.3: Learning Events Feed Component

**Goal:** Display chronological list of cases where the algorithm learned

**Read these files first:**
- `/Users/mike/gauntlet/tutor-dashboard/components/ui/card.tsx`
- `/Users/mike/gauntlet/tutor-dashboard/components/ui/badge.tsx`

**Tasks:**
- [ ] Create NEW: `/Users/mike/gauntlet/tutor-dashboard/components/algorithm/learning-event-card.tsx`
- [ ] Build LearningEventCard component:
  - Props: event (LearningEvent object)
  - Show date and time of event
  - Display student ID (anonymized, e.g., "Student #1247")
  - Show predicted risk vs actual outcome with visual comparison
  - Display "What the System Learned" summary text
  - Show survey response excerpt if available (truncated to 100 chars)
  - Badge showing if prediction was correct/incorrect
  - Link to "View Full Case Study" (opens detail modal)
- [ ] Create NEW: `/Users/mike/gauntlet/tutor-dashboard/components/algorithm/learning-events-feed.tsx`
- [ ] Build LearningEventsFeed component:
  - Props: events (array of LearningEvent), maxEvents?
  - Display events in reverse chronological order
  - Each event uses LearningEventCard
  - Show "Load More" button if more events exist
  - Empty state: "No learning events yet" with friendly message
  - Filter dropdown: All / Correct Predictions / Incorrect Predictions / Has Survey
- [ ] Style as scrollable feed with max height

**What to Test:**
1. Build project - verify no compilation errors
2. Render feed with 5 events - displays in order, newest first
3. Click "View Full Case Study" - link works (doesn't need to go anywhere yet)
4. Test filter - "Incorrect Predictions" shows only wrong predictions
5. Verify empty state displays when events array is empty

**Files Changed:**
- NEW: `/Users/mike/gauntlet/tutor-dashboard/components/algorithm/learning-event-card.tsx` - Single event display
- NEW: `/Users/mike/gauntlet/tutor-dashboard/components/algorithm/learning-events-feed.tsx` - Feed container with filtering

**Notes:**
- Predicted vs Actual comparison should be visual (e.g., "Predicted: High Risk ❌ | Actual: Churned ✅")
- Use time-ago format for dates (e.g., "2 days ago") using date-fns
- Survey responses should be truncated with "..." and full text in modal
- Color-code prediction accuracy: green for correct, red for incorrect

---

### PR 2.4: Case Study Modal Component

**Goal:** Build workflow for analyzing churn cases and generating weight recommendations

**Read these files first:**
- `/Users/mike/gauntlet/tutor-dashboard/components/ui/dialog.tsx` (if exists, otherwise use shadcn)
- `/Users/mike/gauntlet/tutor-dashboard/components/algorithm/weight-panel.tsx` (from PR 2.1)

**Tasks:**
- [ ] Install shadcn dialog if not present: `npx shadcn@latest add dialog`
- [ ] Create NEW: `/Users/mike/gauntlet/tutor-dashboard/components/algorithm/case-study-modal.tsx`
- [ ] Build CaseStudyModal component:
  - Props: studentId, predictedRisk, actualOutcome, surveyResponse?, onClose, onApply
  - Modal dialog with max-width and scrolling
  - Section 1: "What Happened"
    - Display student ID, churn date, churn reasons
    - Show predicted risk level vs actual outcome
    - Highlight discrepancy if prediction was wrong
  - Section 2: "System's Prediction Breakdown"
    - Show all 6 factors with their values and contributions
    - Highlight which factors led to wrong prediction (if applicable)
    - Use bar chart or progress bars to visualize factor contributions
  - Section 3: "Survey Response" (if available)
    - Display full student/parent survey feedback
    - Extract key phrases or sentiment
  - Section 4: "Recommended Weight Adjustments"
    - Use WeightPanel component to show suggested new weights
    - Display rationale for each adjustment (e.g., "Increase First Session weight because first session score was 4.2 but student churned")
    - Show projected accuracy improvement
  - Section 5: "Before/After Impact Projection"
    - Show how many students' predictions would improve with new weights
    - Display accuracy delta (e.g., "73.5% → 76.2%")
  - Action buttons: "Apply Changes", "Modify Weights", "Dismiss Case"
- [ ] Add loading states and error handling

**What to Test:**
1. Build project - verify no compilation errors
2. Open modal with case study data - all sections render correctly
3. Review recommended weights - sum to 1.0 and show rationale
4. Click "Apply Changes" - onApply callback fires with weights
5. Click "Modify Weights" - switches to editable weight panel
6. Test responsive layout on mobile - modal is scrollable

**Files Changed:**
- NEW: `/Users/mike/gauntlet/tutor-dashboard/components/algorithm/case-study-modal.tsx` - Case study analysis workflow

**Notes:**
- Modal should be full-screen on mobile, centered dialog on desktop
- Use existing WeightPanel component for showing/editing recommended weights
- Rationale text should be clear and educational for admins
- Projected accuracy is from calculateRetroactiveAccuracy() service function

---

### PR 2.5: Before/After Comparison Modal

**Goal:** Show retroactive impact of weight changes on historical predictions

**Read these files first:**
- `/Users/mike/gauntlet/tutor-dashboard/components/ui/dialog.tsx`
- `/Users/mike/gauntlet/tutor-dashboard/components/ui/table.tsx` (if exists, otherwise use shadcn)

**Tasks:**
- [ ] Install shadcn table if not present: `npx shadcn@latest add table`
- [ ] Create NEW: `/Users/mike/gauntlet/tutor-dashboard/components/algorithm/before-after-modal.tsx`
- [ ] Build BeforeAfterModal component:
  - Props: oldWeights, newWeights, comparisonResults, onClose, onConfirm
  - Modal dialog with large width for table
  - Section 1: "Weight Changes Summary"
    - Two-column comparison of old vs new weights
    - Highlight deltas (e.g., "+5%" in green, "-3%" in red)
    - Visual weight bars for easy comparison
  - Section 2: "Accuracy Metrics Comparison"
    - Table with 3 columns: Metric, Before, After
    - Rows: Overall Accuracy, False Positives, False Negatives, F1 Score
    - Show deltas with color coding (green for improvement, red for decline)
  - Section 3: "Specific Students Affected"
    - Table of students whose predictions would change
    - Columns: Student ID, Old Prediction, New Prediction, Actual Outcome, Improvement?
    - Filter to show improvements only or all changes
    - Limit to top 10 most impacted students
  - Section 4: "Summary"
    - Overall assessment: "These changes would improve accuracy by X%"
    - Count of students with improved predictions
    - Recommendation: Apply / Needs More Analysis
  - Action buttons: "Confirm & Apply", "Cancel"
- [ ] Add visual indicators for improvements vs regressions

**What to Test:**
1. Build project - verify no compilation errors
2. Open modal with comparison data - all sections populate
3. Verify weight deltas calculate correctly (new - old)
4. Check student table - shows correct prediction changes
5. Verify "improvements only" filter works
6. Test on mobile - table is horizontally scrollable

**Files Changed:**
- NEW: `/Users/mike/gauntlet/tutor-dashboard/components/algorithm/before-after-modal.tsx` - Weight change impact analysis

**Notes:**
- Use green/red color coding consistently for improvements/regressions
- Table should be sortable by impact magnitude
- Improvement detection: new prediction closer to actual outcome than old prediction
- Include helpful tooltips explaining F1 score, precision, recall for admins

---

## Phase 3: Algorithm Dashboard Page

**Estimated Time:** 4-5 hours

This phase assembles all components into the main Algorithm Refinement Dashboard page.

### PR 3.1: Algorithm Dashboard Page Layout

**Goal:** Create main dashboard page with all sections integrated

**Read these files first:**
- `/Users/mike/gauntlet/tutor-dashboard/app/dashboard/page.tsx` (for layout patterns)
- All components from Phase 2 (PR 2.1-2.5)

**Tasks:**
- [ ] Create NEW: `/Users/mike/gauntlet/tutor-dashboard/app/dashboard/algorithm/page.tsx`
- [ ] Build Algorithm Dashboard page structure:
  - Page header with title "Algorithm Refinement Dashboard"
  - Subtitle explaining purpose: "Monitor and improve churn prediction accuracy"
  - Last updated timestamp
  - 5 main sections in responsive grid layout
- [ ] Section 1: Model Performance Summary (top, full width)
  - Use PerformanceSummary component
  - Fetch data via Server Component from churn-service
- [ ] Section 2: Churn Prediction Factors & Weights (left column)
  - Use WeightPanel component
  - Load current weights from service
  - Handle weight updates via Server Action
  - Show success toast on save
- [ ] Section 3: Recent Learning Events (right column)
  - Use LearningEventsFeed component
  - Fetch last 20 learning events
  - Scrollable container with max height
- [ ] Section 4: Quick Actions panel (below main sections)
  - Button: "Analyze Recent Churns" - opens case study workflow
  - Button: "View Full History" - links to weight history page
  - Button: "Export Model Report" - downloads summary (future feature)
- [ ] Implement responsive layout:
  - Desktop: 2-column grid for sections 2 & 3
  - Tablet: Stacked sections with full width
  - Mobile: Single column, sections collapse

**What to Test:**
1. Build project - verify no compilation errors
2. Navigate to /dashboard/algorithm - page loads without errors
3. Verify all 5 sections render with real data from services
4. Test weight adjustment - sliders work, validation shows
5. Check responsive layout - looks good on mobile, tablet, desktop
6. Test navigation - header links work, back to dashboard works

**Files Changed:**
- NEW: `/Users/mike/gauntlet/tutor-dashboard/app/dashboard/algorithm/page.tsx` - Main algorithm dashboard page

**Notes:**
- Use Server Components for initial data fetching
- Use Client Components for interactive parts (sliders, modals)
- Follow existing dashboard layout patterns for consistency
- Add loading.tsx and error.tsx for route error handling

---

### PR 3.2: Weight Update Server Action

**Goal:** Create server action for saving weight changes with validation

**Read these files first:**
- `/Users/mike/gauntlet/tutor-dashboard/app/dashboard/algorithm/page.tsx` (from PR 3.1)
- `/Users/mike/gauntlet/tutor-dashboard/services/churn-service.ts`
- `/Users/mike/gauntlet/tutor-dashboard/lib/supabase/server.ts` (for auth)

**Tasks:**
- [ ] Create NEW: `/Users/mike/gauntlet/tutor-dashboard/app/dashboard/algorithm/actions.ts`
- [ ] Implement `updateWeights` server action:
  - Mark with 'use server' directive
  - Accept: newWeights (Record<string, number>), changeReason (string)
  - Validate user is authenticated admin via Supabase
  - Call validateWeights() from churn-service
  - Return error if validation fails
  - Call updateAlgorithmWeights() from churn-service
  - Return success with new version number and accuracy metrics
  - Use proper error handling and return types
- [ ] Implement `simulateWeightChange` server action:
  - Accept: proposedWeights (Record<string, number>)
  - Calculate retroactive accuracy without saving
  - Return AccuracyMetrics and affected students list
  - Used for "Preview Impact" feature before saving
- [ ] Implement `createChurnCaseStudy` server action:
  - Accept: studentId, surveyResponse (optional)
  - Fetch student data and calculate predicted vs actual
  - Call createCaseStudy() from churn-service
  - Return CaseStudyRecommendation
- [ ] Implement `applyCaseStudyWeights` server action:
  - Accept: caseStudyId, acceptedWeights
  - Validate and apply weights
  - Link to case study in history
  - Return success result
- [ ] Add TypeScript return types for all actions using FormState pattern

**What to Test:**
1. Build project - verify no TypeScript errors
2. Call updateWeights action from client - successfully saves weights
3. Verify new version created in churn_algorithm_weights table
4. Verify history entry in churn_weight_history table
5. Call simulateWeightChange - returns accuracy without saving
6. Test authentication - action fails if not admin
7. Test validation - action returns error for invalid weights

**Files Changed:**
- NEW: `/Users/mike/gauntlet/tutor-dashboard/app/dashboard/algorithm/actions.ts` - Server actions for weight management

**Notes:**
- Use revalidatePath('/dashboard/algorithm') after weight updates
- Return detailed error messages for validation failures
- Include accuracy delta in success response for toast notification
- Use Supabase auth to get current admin user ID for audit trail

---

### PR 3.3: Case Study Workflow Integration

**Goal:** Wire up case study modal and workflow for analyzing churns

**Read these files first:**
- `/Users/mike/gauntlet/tutor-dashboard/app/dashboard/algorithm/page.tsx` (from PR 3.1)
- `/Users/mike/gauntlet/tutor-dashboard/app/dashboard/algorithm/actions.ts` (from PR 3.2)
- `/Users/mike/gauntlet/tutor-dashboard/components/algorithm/case-study-modal.tsx` (from PR 2.4)

**Tasks:**
- [ ] Update `/Users/mike/gauntlet/tutor-dashboard/app/dashboard/algorithm/page.tsx`
- [ ] Add "Analyze Recent Churns" feature:
  - Fetch recent churned students from service
  - Display list in a modal or side panel
  - Each churned student shows: ID, churn date, predicted risk, actual outcome
  - Button to "Create Case Study" for each student
- [ ] Integrate CaseStudyModal:
  - Add state management for modal open/close
  - Pass student data and recommendations to modal
  - Wire up "Apply Changes" to applyCaseStudyWeights action
  - Show success toast on apply
  - Refresh learning events feed after apply
- [ ] Add loading states:
  - Skeleton loaders while fetching data
  - Disabled states during server action execution
  - Progress indicators for retroactive analysis
- [ ] Add error handling:
  - Display error toast if actions fail
  - Show friendly error messages
  - Allow retry on failure

**What to Test:**
1. Build project - verify no compilation errors
2. Click "Analyze Recent Churns" - modal opens with churned students
3. Click "Create Case Study" - generates recommendations
4. Review recommendations in modal - weights sum to 1.0
5. Click "Apply Changes" - successfully updates weights
6. Verify learning events feed updates with new entry
7. Test error handling - show toast if action fails

**Files Changed:**
- `/Users/mike/gauntlet/tutor-dashboard/app/dashboard/algorithm/page.tsx` - Add case study workflow

**Notes:**
- Use React state for modal visibility (useState)
- Consider using Zustand if state management gets complex
- Install sonner for toast notifications if not present: `npx shadcn@latest add sonner`
- Provide clear feedback throughout workflow (loading, success, error)

---

### PR 3.4: Before/After Comparison Integration

**Goal:** Add simulation and comparison features before applying weights

**Read these files first:**
- `/Users/mike/gauntlet/tutor-dashboard/app/dashboard/algorithm/page.tsx` (updated in PR 3.3)
- `/Users/mike/gauntlet/tutor-dashboard/components/algorithm/before-after-modal.tsx` (from PR 2.5)
- `/Users/mike/gauntlet/tutor-dashboard/app/dashboard/algorithm/actions.ts` (from PR 3.2)

**Tasks:**
- [ ] Update `/Users/mike/gauntlet/tutor-dashboard/app/dashboard/algorithm/page.tsx`
- [ ] Add "Preview Impact" button to WeightPanel:
  - Button appears when weights are modified
  - Disabled if weights don't sum to 1.0
  - Calls simulateWeightChange server action
  - Shows loading state during calculation
- [ ] Integrate BeforeAfterModal:
  - Opens when "Preview Impact" completes
  - Displays comparison results from simulateWeightChange
  - Shows old weights, new weights, accuracy delta
  - Lists affected students with prediction changes
  - "Confirm & Apply" button to save weights
  - "Cancel" to return to editing
- [ ] Add confirmation flow:
  - User adjusts weights → Preview Impact → Review comparison → Confirm & Apply
  - Clear visual progression through workflow
  - Breadcrumb or step indicator showing current stage
- [ ] Add undo/reset functionality:
  - "Reset to Current" button to abandon changes
  - "Revert to Version X" feature to rollback (uses weight history)

**What to Test:**
1. Build project - verify no compilation errors
2. Adjust weights in panel - "Preview Impact" button appears
3. Click "Preview Impact" - loading state shows, then modal opens
4. Review comparison modal - all sections populated correctly
5. Click "Confirm & Apply" - saves weights and closes modal
6. Click "Cancel" - returns to weight editing without saving
7. Test "Reset to Current" - weights return to saved version

**Files Changed:**
- `/Users/mike/gauntlet/tutor-dashboard/app/dashboard/algorithm/page.tsx` - Add preview and comparison workflow

**Notes:**
- Simulation can take a few seconds for retroactive analysis - show progress
- Comparison modal should make it clear these are projections, not guarantees
- Allow users to modify weights after preview (loop back to editing)
- Save confirmation should show accuracy improvement in toast

---

### PR 3.5: Navigation & Polish

**Goal:** Add navigation integration and final polish to dashboard

**Read these files first:**
- `/Users/mike/gauntlet/tutor-dashboard/app/dashboard/algorithm/page.tsx` (updated in PR 3.4)
- `/Users/mike/gauntlet/tutor-dashboard/app/layout.tsx` or dashboard layout

**Tasks:**
- [ ] Update dashboard navigation to include Algorithm link:
  - Add "Algorithm" or "Model Settings" to main nav
  - Use beaker/flask icon or brain icon from lucide-react
  - Position near Settings in nav hierarchy
- [ ] Add breadcrumb navigation:
  - Dashboard > Algorithm Refinement
  - Clickable breadcrumbs to navigate back
- [ ] Create `/Users/mike/gauntlet/tutor-dashboard/app/dashboard/algorithm/loading.tsx`:
  - Skeleton loaders for performance summary
  - Skeleton for weight sliders
  - Skeleton for learning events feed
- [ ] Create `/Users/mike/gauntlet/tutor-dashboard/app/dashboard/algorithm/error.tsx`:
  - Error boundary for algorithm page
  - Friendly error message with retry button
  - Option to return to dashboard
- [ ] Add help/info tooltips throughout:
  - Explain what each factor measures
  - Tooltip for accuracy metrics (precision, recall, F1)
  - Info icon with modal explaining how algorithm works
- [ ] Polish animations and transitions:
  - Smooth slider movements
  - Fade in/out for modals
  - Loading spinners for async operations
- [ ] Add keyboard shortcuts:
  - Cmd/Ctrl + S to save weights
  - Escape to close modals

**What to Test:**
1. Build project - verify no compilation errors
2. Navigate to /dashboard/algorithm from main dashboard - link works
3. Test loading.tsx - skeleton shows while data fetches
4. Trigger error.tsx - force error and verify boundary catches it
5. Hover over info icons - tooltips display correctly
6. Test keyboard shortcuts - Cmd+S saves, Esc closes modals
7. Verify smooth animations and transitions throughout

**Files Changed:**
- `/Users/mike/gauntlet/tutor-dashboard/app/dashboard/algorithm/page.tsx` - Add tooltips and polish
- NEW: `/Users/mike/gauntlet/tutor-dashboard/app/dashboard/algorithm/loading.tsx` - Loading states
- NEW: `/Users/mike/gauntlet/tutor-dashboard/app/dashboard/algorithm/error.tsx` - Error boundary
- Update navigation file (likely `/Users/mike/gauntlet/tutor-dashboard/app/dashboard/layout.tsx` or similar)

**Notes:**
- Use lucide-react for icons (consistent with existing codebase)
- Follow Tailwind animation classes for smooth transitions
- Ensure all tooltips are accessible (keyboard navigable)
- Test on multiple browsers (Chrome, Safari, Firefox)

---

## Phase 4: Testing & Documentation

**Estimated Time:** 2-3 hours

This phase ensures quality and provides documentation for the feature.

### PR 4.1: Integration Testing & Bug Fixes

**Goal:** Test complete workflow end-to-end and fix any issues

**Read these files first:**
- All files created in Phases 1-3

**Tasks:**
- [ ] Test complete workflow from start to finish:
  - Load algorithm dashboard
  - View current weights and performance
  - Adjust weights using sliders
  - Preview impact with before/after comparison
  - Save weights and verify history entry
  - Create case study from churned student
  - Apply case study recommendations
  - Verify learning event appears in feed
- [ ] Test edge cases:
  - No churned students yet (empty state)
  - No learning events (empty feed)
  - Invalid weight values (validation)
  - Network errors during save (error handling)
  - Concurrent weight updates (optimistic locking if needed)
- [ ] Fix any bugs discovered:
  - Document issues found
  - Implement fixes
  - Re-test affected areas
- [ ] Performance testing:
  - Measure retroactive accuracy calculation time
  - Optimize queries if slow (add indexes if needed)
  - Test with 100+ students
- [ ] Accessibility audit:
  - Test keyboard navigation
  - Verify screen reader compatibility
  - Check color contrast ratios
  - Ensure all interactive elements are accessible

**What to Test:**
1. Complete end-to-end workflow - all steps work smoothly
2. Test all edge cases - appropriate handling/messaging
3. Performance benchmarks - retroactive analysis < 5 seconds
4. Accessibility - all WCAG AA requirements met
5. Cross-browser testing - works in Chrome, Safari, Firefox
6. Mobile responsiveness - all features work on mobile

**Files Changed:**
- Various bug fixes across multiple files
- Potential performance optimizations in service layer

**Notes:**
- Document any known limitations or future improvements
- If retroactive analysis is slow, consider caching or pre-calculation
- Ensure error messages are helpful and actionable
- Test with realistic data volumes

---

### PR 4.2: Documentation & Usage Guide

**Goal:** Document the feature for admins and future developers

**Read these files first:**
- `/Users/mike/gauntlet/tutor-dashboard/docs/project_overview.md`
- All service files created in Phase 1

**Tasks:**
- [ ] Create NEW: `/Users/mike/gauntlet/tutor-dashboard/docs/algorithm_dashboard_guide.md`:
  - Overview of the algorithm refinement dashboard
  - Explanation of churn prediction factors
  - How to interpret accuracy metrics
  - Step-by-step guide for adjusting weights
  - Case study workflow walkthrough
  - Best practices for weight adjustments
  - FAQ section
- [ ] Add inline code documentation:
  - JSDoc comments for all service functions
  - Explain parameters and return values
  - Document validation rules
  - Add examples where helpful
- [ ] Update `/Users/mike/gauntlet/tutor-dashboard/docs/database_schema.md`:
  - Document churn_algorithm_weights table usage
  - Document churn_weight_history table
  - Explain weight versioning system
  - Add example queries
- [ ] Create admin training materials:
  - Screenshot-based walkthrough
  - Example scenarios (when to adjust weights)
  - Interpretation guide for metrics
  - Troubleshooting common issues

**What to Test:**
1. Review all documentation - clear and comprehensive
2. Follow guide as if new admin - can complete workflow
3. Verify all examples are accurate and work
4. Check that JSDoc comments render correctly in IDE
5. Ensure documentation is up-to-date with implementation

**Files Changed:**
- NEW: `/Users/mike/gauntlet/tutor-dashboard/docs/algorithm_dashboard_guide.md` - Admin user guide
- `/Users/mike/gauntlet/tutor-dashboard/docs/database_schema.md` - Update with churn tables
- Add JSDoc comments to service files

**Notes:**
- Documentation should be accessible to non-technical admins
- Include visual examples and screenshots where helpful
- Explain the "why" behind weight adjustments, not just "how"
- Provide clear guidance on interpreting conflicting metrics

---

## Summary

This task document provides a comprehensive roadmap for implementing the Algorithm Refinement Dashboard in 4 phases with 15 PRs. The feature demonstrates the system's self-learning capability through:

1. **Phase 1** (3 PRs): Backend service layer for churn calculation, weight management, and learning events
2. **Phase 2** (5 PRs): Reusable UI components for sliders, performance display, events feed, and modals
3. **Phase 3** (5 PRs): Main dashboard page with full workflow integration and polish
4. **Phase 4** (2 PRs): Testing, bug fixes, and comprehensive documentation

**Key Files Created:**
- `/Users/mike/gauntlet/tutor-dashboard/services/churn-service.ts` - Churn algorithm engine
- `/Users/mike/gauntlet/tutor-dashboard/app/dashboard/algorithm/page.tsx` - Main dashboard page
- `/Users/mike/gauntlet/tutor-dashboard/app/dashboard/algorithm/actions.ts` - Server actions
- 7 new UI components in `/Users/mike/gauntlet/tutor-dashboard/components/algorithm/`
- Comprehensive documentation in `/Users/mike/gauntlet/tutor-dashboard/docs/`

**Critical Constraints:**
- All weights must sum to exactly 1.0
- Retroactive accuracy calculations should complete in < 5 seconds
- All weight changes are audited in churn_weight_history
- UI must work on mobile, tablet, and desktop

The implementation prioritizes demonstrating AI/ML learning capability without requiring actual machine learning models, using rule-based recommendations and retroactive analysis for the MVP.
