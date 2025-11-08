# Platform Metrics & Data Layer - Implementation Tasks

## Context

Phase 4.1 establishes the foundational data access layer and calculation utilities that all other Phase 4 features depend on. This phase creates a robust service layer architecture for querying, aggregating, and calculating metrics from the database using Drizzle ORM.

The current state has a complete database schema with Drizzle ORM configured, including tables for users, tutors, students, sessions, metrics (audio/video/screen), feedback, alerts, achievements, and churn tracking. All schema files are in `/Users/mike/gauntlet/tutor-dashboard/lib/db/schema/`, and TypeScript types are defined in `/Users/mike/gauntlet/tutor-dashboard/lib/db/types.ts`. The database connection is established in `/Users/mike/gauntlet/tutor-dashboard/lib/db/index.ts`.

This phase focuses on creating reusable service functions in a new `services/` directory following Next.js 15 App Router patterns. These services will be consumed by Server Components for initial rendering and cached appropriately for performance. The data layer must handle optional metrics gracefully (video/screen analytics may not always be present), provide efficient aggregations with proper indexing considerations, and support both real-time calculations and pre-aggregated snapshots.

**Key Design Principles:**
- Service functions are async and return typed data structures
- Use Drizzle ORM's query builder for all database access (never raw SQL)
- Implement proper error handling with try/catch and meaningful error messages
- Cache expensive calculations using appropriate TTL strategies
- Handle missing/optional data without throwing errors (return null or default values)
- Calculate metrics only from available data (don't penalize missing video/screen metrics)
- Follow existing patterns from `/Users/mike/gauntlet/tutor-dashboard/lib/db/` for consistency

## Instructions for AI Agent

**Standard Workflow:**
1. **Read Phase**: Start each PR by reading all files listed in the "Read these files first" section to understand current implementation
2. **Implement Tasks**: Complete tasks in order, grouping related changes together
3. **Mark Complete**: Mark each task with [x] when finished
4. **Test**: Follow the "What to Test" section to validate your changes
5. **Summary**: Provide a completion summary listing files changed and key functionality added
6. **Wait for Approval**: Do not proceed to the next PR until the current one is approved

**File Organization:**
- All service functions go in `/Users/mike/gauntlet/tutor-dashboard/services/`
- One file per domain (e.g., `tutor-service.ts`, `session-service.ts`, `platform-service.ts`)
- Export typed interfaces for all return values
- Import from `@/lib/db` for database access and types

**Error Handling Pattern:**
```typescript
try {
  const result = await db.query...
  return result
} catch (error) {
  console.error('Error in [functionName]:', error)
  throw new Error('Failed to [action]: ' + (error as Error).message)
}
```

---

## Phase 1: Core Service Infrastructure

**Estimated Time:** 3-4 hours

This phase establishes the foundational service layer structure and core data access patterns that all subsequent phases will build upon.

### PR 1.1: Session Data Service

**Goal:** Create comprehensive session data retrieval functions with full metrics loading

**Read these files first:**
- `/Users/mike/gauntlet/tutor-dashboard/lib/db/schema/sessions.ts`
- `/Users/mike/gauntlet/tutor-dashboard/lib/db/schema/metrics.ts`
- `/Users/mike/gauntlet/tutor-dashboard/lib/db/types.ts`
- `/Users/mike/gauntlet/tutor-dashboard/lib/db/index.ts`

**Tasks:**
- [x] Create NEW: `/Users/mike/gauntlet/tutor-dashboard/services/session-service.ts`
- [x] Implement `getSessionById(sessionId: string)`:
  - Fetch session with all related metrics (audio, video, screen, feedback, transcript highlights)
  - Use Drizzle's `eq()` and leftJoin for optional metrics
  - Return typed `SessionWithMetrics` interface
  - Handle cases where video/screen metrics don't exist (return null for those fields)
- [x] Implement `getSessionsByTutorId(tutorId: string, options?)`:
  - Support optional filters: status, date range, limit, offset
  - Order by scheduled_start DESC by default
  - Include session score and basic metrics (no full joins)
  - Return array of `SessionSummary` interface
- [x] Implement `getSessionsByStudentId(studentId: string, options?)`:
  - Similar to tutor version but student-focused
  - Include tutor name/id in response
  - Track session_number for progression
- [x] Implement `getRecentSessions(limit: number, filters?)`:
  - Support filters: status (completed/all), flagged_only (score < 6.5), date range
  - Include tutor name, student ID, subject name via joins
  - Efficient query with proper limits
- [x] Define TypeScript interfaces for all return types at top of file

**What to Test:**
1. Build project - verify no TypeScript errors
2. Import session-service functions in a test file - verify all exports work
3. Check Drizzle query generation - ensure no N+1 queries (use `.then(sql => console.log(sql))` during dev)
4. Verify optional metrics handling - sessions without video/screen don't crash

**Files Changed:**
- NEW: `/Users/mike/gauntlet/tutor-dashboard/services/session-service.ts` - Session data access layer

**Notes:**
- Use `leftJoin` for optional metrics (video, screen, feedback) so missing data returns null
- Use `innerJoin` for required relations (tutor, student, subject)
- All date ranges should use Drizzle's `and()`, `gte()`, `lte()` for type safety

---

### PR 1.2: Tutor Data Service

**Goal:** Create tutor data retrieval with basic aggregations from sessions

**Read these files first:**
- `/Users/mike/gauntlet/tutor-dashboard/lib/db/schema/tutors.ts`
- `/Users/mike/gauntlet/tutor-dashboard/lib/db/schema/users.ts`
- `/Users/mike/gauntlet/tutor-dashboard/services/session-service.ts` (completed in PR 1.1)

**Tasks:**
- [x] Create NEW: `/Users/mike/gauntlet/tutor-dashboard/services/tutor-service.ts`
- [x] Implement `getTutorById(tutorId: string)`:
  - Fetch tutor with user info, subjects, basic profile data
  - Join with tutor_subjects and subjects table
  - Return `TutorProfile` interface with user details
- [x] Implement `getAllTutors(options?)`:
  - Support filters: active_only, subject_id
  - Include user name and email
  - Order by member_since DESC
  - Return array of `TutorSummary` interface
- [x] Implement `getTutorSubjects(tutorId: string)`:
  - Fetch all subjects this tutor teaches
  - Return array of Subject objects
- [x] Implement `getTutorSessionCount(tutorId: string, options?)`:
  - Count sessions with optional filters (status, date range)
  - Use Drizzle's `count()` aggregation
  - Return number
- [x] Implement `getTutorPerformanceSnapshots(tutorId: string, periodType?, days?)`:
  - Fetch pre-aggregated snapshots from tutor_performance_snapshots table
  - Default to last 30 days, weekly periods
  - Order by snapshot_date DESC
  - Return array of snapshot objects for charting
- [x] Define TypeScript interfaces for all return types

**What to Test:**
1. Build project - verify no compilation errors
2. Call getTutorById with valid tutor ID - verify subjects are loaded
3. Call getTutorSessionCount with date range - verify accurate count
4. Call getTutorPerformanceSnapshots - verify proper date ordering

**Files Changed:**
- NEW: `/Users/mike/gauntlet/tutor-dashboard/services/tutor-service.ts` - Tutor data access layer

**Notes:**
- Performance snapshots are pre-aggregated, so just query the table directly
- Subject junction table requires join through tutor_subjects
- Keep aggregations simple in this PR - complex metrics come in Phase 2

---

### PR 1.3: Student Data Service

**Goal:** Create student data retrieval with churn tracking

**Read these files first:**
- `/Users/mike/gauntlet/tutor-dashboard/lib/db/schema/students.ts`
- `/Users/mike/gauntlet/tutor-dashboard/lib/db/schema/churn.ts`
- `/Users/mike/gauntlet/tutor-dashboard/lib/db/types.ts`

**Tasks:**
- [x] Create NEW: `/Users/mike/gauntlet/tutor-dashboard/services/student-service.ts`
- [x] Implement `getStudentById(studentId: string)`:
  - Fetch student with user info, subjects, status
  - Include churn reasons if status is 'churned'
  - Return `StudentProfile` interface
- [x] Implement `getAllStudents(options?)`:
  - Support filters: status (active/churned/paused), grade_level
  - Include user name and enrolled_since
  - Order by enrolled_since DESC
  - Return array of `StudentSummary` interface
- [x] Implement `getStudentChurnReasons(studentId: string)`:
  - Fetch all churn reasons for student from junction table
  - Return array of ChurnReasonType
- [x] Implement `getStudentTutorHistory(studentId: string)`:
  - Query sessions grouped by tutor_id
  - Return list of tutors this student has worked with
  - Include count of sessions with each tutor
  - Detect tutor switches (session_number resets)
- [x] Implement `getStudentSessionCount(studentId: string, options?)`:
  - Count sessions with optional filters
  - Similar to tutor version but student-focused
- [x] Define TypeScript interfaces for all return types

**What to Test:**
1. Build project - verify TypeScript compilation
2. Call getStudentById - verify churn reasons load for churned students
3. Call getStudentTutorHistory - verify tutor list and session counts
4. Verify status filtering in getAllStudents - active vs churned

**Files Changed:**
- NEW: `/Users/mike/gauntlet/tutor-dashboard/services/student-service.ts` - Student data access layer

**Notes:**
- Churn reasons are many-to-many via student_churn_reasons table
- Tutor history requires grouping sessions by tutor_id with count
- Handle optional fields (grade_level, parent_email) gracefully

---

## Phase 2: Metric Calculations & Aggregations

**Estimated Time:** 4-5 hours

This phase implements the calculation logic for all metrics displayed in the UI, including platform-wide statistics, tutor performance scores, and student churn risk.

### PR 2.1: Platform Metrics Service

**Goal:** Calculate platform-wide statistics for the admin dashboard homepage

**Read these files first:**
- `/Users/mike/gauntlet/tutor-dashboard/services/session-service.ts`
- `/Users/mike/gauntlet/tutor-dashboard/services/tutor-service.ts`
- `/Users/mike/gauntlet/tutor-dashboard/docs/project_overview.md` (lines 34-65 for platform health metrics)

**Tasks:**
- [x] Create NEW: `/Users/mike/gauntlet/tutor-dashboard/services/platform-service.ts`
- [x] Implement `getPlatformHealthMetrics(dateRange?)`:
  - Calculate average session score across all completed sessions
  - Calculate first session convert rate (% of session_number=1 that lead to session_number=2)
  - Count tutors at churn risk (call `getTutorChurnRisk` for each, count highs)
  - Calculate no-show rate (no_show sessions / total scheduled)
  - Calculate trend indicators (compare to previous period)
  - Return `PlatformHealthMetrics` interface
- [x] Implement `getTopPerformers(limit: number, dateRange?)`:
  - Query tutors ordered by average session score DESC
  - Include session count, overall score, tutor name
  - Minimum 5 sessions in period to qualify
  - Return array of `TutorPerformance` interface
- [x] Implement `getNeedsAttention(limit: number, dateRange?)`:
  - Query tutors with active alerts or low scores (< 6.5)
  - Include alert count, overall score, tutor name
  - Order by severity (critical alerts first, then score)
  - Return array of `TutorAlert` interface
- [x] Implement helper: `calculateTrendPercentage(current, previous)`:
  - Return percentage change with +/- sign
  - Handle divide-by-zero cases
- [x] Define TypeScript interfaces for all return types

**What to Test:**
1. Build project - verify compilation
2. Call getPlatformHealthMetrics - verify all 4 metrics return valid numbers
3. Verify first session convert rate logic - check session_number sequencing
4. Call getTopPerformers - verify minimum session threshold works
5. Test with empty database - ensure no crashes, returns zeros/empty arrays

**Files Changed:**
- NEW: `/Users/mike/gauntlet/tutor-dashboard/services/platform-service.ts` - Platform-wide metrics

**Notes:**
- First session convert rate requires checking if students with session_number=1 have session_number=2 with same tutor
- Use Drizzle's `count()`, `avg()`, and `sum()` for aggregations
- Trend calculations need two queries (current period vs previous period)
- This will be a slower query - plan for caching in Phase 3

---

### PR 2.2: Tutor Calculation Service

**Goal:** Calculate all derived tutor metrics (overall score, rebook rate, churn risk, etc.)

**Read these files first:**
- `/Users/mike/gauntlet/tutor-dashboard/services/tutor-service.ts`
- `/Users/mike/gauntlet/tutor-dashboard/services/session-service.ts`
- `/Users/mike/gauntlet/tutor-dashboard/docs/project_overview.md` (lines 413-451 for calculation rules)

**Tasks:**
- [x] Add to `/Users/mike/gauntlet/tutor-dashboard/services/tutor-service.ts`:
- [x] Implement `getTutorOverallScore(tutorId: string, dateRange?)`:
  - Query all session scores for tutor in range
  - Calculate weighted average (recent sessions weighted higher)
  - Use last 30 sessions if no date range specified
  - Return number (0-10) or null if no sessions
- [x] Implement `getTutorRebookRate(tutorId: string, dateRange?)`:
  - Count completed sessions with follow_up_booked = true
  - Divide by total completed sessions
  - Return percentage (0-100) or null
- [x] Implement `getTutorFirstSessionConvertRate(tutorId: string)`:
  - Find all first sessions (session_number = 1)
  - Check how many led to session_number = 2 with same student
  - Return percentage (0-100) or null
- [x] Implement `getTutorChurnRisk(tutorId: string)`:
  - Count no-shows in last 30 days
  - Count reschedules in last 30 days
  - Count late arrivals (actual_start > scheduled_start + 5 min)
  - Apply thresholds: high (>=2 no-shows OR >=5 reschedules), medium (1 no-show OR 3-4 reschedules), low (else)
  - Return 'low' | 'medium' | 'high'
- [x] Implement `getTutorStudentEngagement(tutorId: string, dateRange?)`:
  - Average of student_engagement_score from session_audio_metrics
  - Only include completed sessions with audio analysis
  - Return number (0-10) or null
- [x] Implement `getTutorAvgStudentRating(tutorId: string, dateRange?)`:
  - Average of student_satisfaction_rating from session_feedback
  - Only sessions with feedback submitted
  - Return number (1-5) or null if no feedback
- [x] Implement `getTutorRatingScoreDivergence(tutorId: string)`:
  - Calculate abs(avg_student_rating * 2 - overall_score)
  - Return number or null if either metric is missing
- [x] Define interfaces for return types

**What to Test:**
1. Build project - verify compilation
2. Call getTutorOverallScore - verify weighted average logic
3. Call getTutorChurnRisk - verify threshold logic (high/medium/low)
4. Test with tutor who has no feedback - verify null handling
5. Verify rebook rate calculation - check follow_up_booked flag accuracy

**Files Changed:**
- `/Users/mike/gauntlet/tutor-dashboard/services/tutor-service.ts` - Add calculation functions

**Notes:**
- Weighted average for overall score: more recent sessions have higher weight (use exponential decay)
- Rating divergence helps identify tutors where student perception differs from AI analysis
- Churn risk thresholds are defined in project_overview.md lines 425-429

---

### PR 2.3: Student Calculation Service

**Goal:** Calculate student churn risk using weighted algorithm

**Read these files first:**
- `/Users/mike/gauntlet/tutor-dashboard/services/student-service.ts`
- `/Users/mike/gauntlet/tutor-dashboard/lib/db/schema/churn.ts`
- `/Users/mike/gauntlet/tutor-dashboard/docs/project_overview.md` (lines 534-552 for churn factor categories)

**Tasks:**
- [x] Add to `/Users/mike/gauntlet/tutor-dashboard/services/student-service.ts`:
- [x] Implement `getChurnAlgorithmWeights()`:
  - Query latest version from churn_algorithm_weights table
  - Return map of factor_category to weight
  - If no weights exist, return default weights (first_session_satisfaction: 0.25, sessions_completed: 0.15, etc.)
- [x] Implement `calculateChurnFactor(studentId, factorCategory, weight)`:
  - For each factor category, query relevant data and normalize to 0-1 scale
  - first_session_satisfaction: Get session_number=1 score, normalize (10 = 0 risk, 0 = 1 risk)
  - sessions_completed: More sessions = lower risk (>10 sessions = 0 risk, 0-2 sessions = 1 risk)
  - follow_up_booking_rate: Calculate from sessions, normalize
  - avg_session_score: Normalize score (10 = 0 risk, 0 = 1 risk)
  - tutor_consistency: Count tutor switches, normalize
  - student_engagement: Average engagement score, normalize
  - Calculate contribution_to_risk = weight * normalized_score
  - Return `ChurnFactor` object (from types.ts)
- [x] Implement `getStudentChurnRiskScore(studentId: string)`:
  - Get current algorithm weights
  - Calculate all churn factors
  - Sum contribution_to_risk values
  - Return score 0-100 (multiply by 100)
- [x] Implement `getStudentChurnRiskLevel(studentId: string)`:
  - Call getStudentChurnRiskScore
  - Apply thresholds: high (>70), medium (40-70), low (<40)
  - Return 'low' | 'medium' | 'high'
- [x] Implement `getStudentChurnFactors(studentId: string)`:
  - Calculate all factors with full details
  - Separate into risk_factors (negative impact) and protective_factors (positive impact)
  - Return `{ risk_factors: ChurnFactor[], protective_factors: ChurnFactor[] }`
- [x] Define interfaces for return types

**What to Test:**
1. Build project - verify compilation
2. Call getChurnAlgorithmWeights - verify default weights sum to 1.0
3. Call getStudentChurnRiskScore - verify score is 0-100
4. Test with new student (1 session) - verify high risk score
5. Test with established student (20+ sessions) - verify lower risk score
6. Verify factor normalization - check edge cases (0 sessions, perfect scores)

**Files Changed:**
- `/Users/mike/gauntlet/tutor-dashboard/services/student-service.ts` - Add churn calculation functions

**Notes:**
- Normalization functions should handle edge cases gracefully (division by zero, missing data)
- Each factor category has different normalization logic - see project_overview.md for details
- Weights must sum to 1.0 - validate this when fetching from database
- Protective factors have negative impact scores (they reduce overall risk)

---

## Phase 3: Caching & Performance Optimization

**Estimated Time:** 3-4 hours

This phase implements caching strategies for expensive queries and adds performance optimizations to support real-time dashboard usage.

### PR 3.1: Cache Infrastructure Setup

**Goal:** Set up caching utilities and patterns for service layer

**Read these files first:**
- `/Users/mike/gauntlet/tutor-dashboard/services/platform-service.ts`
- `/Users/mike/gauntlet/tutor-dashboard/services/tutor-service.ts`

**Tasks:**
- [x] Create NEW: `/Users/mike/gauntlet/tutor-dashboard/lib/cache.ts`
- [x] Implement in-memory cache using Map with TTL:
  - Create `CacheManager` class with get/set/delete/clear methods
  - Each entry stores: value, expiration timestamp
  - Implement automatic cleanup of expired entries
  - Export singleton instance
- [x] Implement cache key generation helper:
  - `generateCacheKey(prefix: string, params: Record<string, any>)`
  - Deterministic string creation from parameters
  - Example: "platform:health:2024-01-01:2024-01-31"
- [x] Implement cache wrapper function:
  - `withCache<T>(key, ttlSeconds, fetchFn)` generic function
  - Check cache first, return if valid
  - Call fetchFn if cache miss or expired
  - Store result with TTL
  - Handle errors gracefully
- [x] Add TypeScript interfaces for cache types

**What to Test:**
1. Build project - verify compilation
2. Test CacheManager.set and get - verify retrieval works
3. Test TTL expiration - set 1 second TTL, wait, verify expired
4. Test withCache wrapper - verify it only calls fetchFn on cache miss
5. Test cache key generation - verify same params = same key

**Files Changed:**
- NEW: `/Users/mike/gauntlet/tutor-dashboard/lib/cache.ts` - Caching infrastructure

**Notes:**
- Use simple in-memory cache for MVP (can upgrade to Redis later)
- TTL should be configurable per query type
- Cache keys must be deterministic for consistent behavior

---

### PR 3.2: Apply Caching to Platform Metrics

**Goal:** Cache expensive platform-wide calculations

**Read these files first:**
- `/Users/mike/gauntlet/tutor-dashboard/lib/cache.ts` (completed in PR 3.1)
- `/Users/mike/gauntlet/tutor-dashboard/services/platform-service.ts`

**Tasks:**
- [x] Update `/Users/mike/gauntlet/tutor-dashboard/services/platform-service.ts`:
- [x] Wrap `getPlatformHealthMetrics` with cache:
  - Use 5-minute TTL
  - Cache key includes date range
  - Import and use `withCache` helper
- [x] Wrap `getTopPerformers` with cache:
  - Use 10-minute TTL
  - Cache key includes limit and date range
- [x] Wrap `getNeedsAttention` with cache:
  - Use 5-minute TTL (more critical, needs fresher data)
  - Cache key includes limit and date range
- [x] Add cache invalidation function:
  - `invalidatePlatformCache()` clears all platform-related cache keys
  - Call when new session data is added
- [x] Add JSDoc comments explaining caching behavior

**What to Test:**
1. Build project - verify compilation
2. Call getPlatformHealthMetrics twice - verify second call is cached (faster)
3. Wait 5+ minutes, call again - verify cache refresh
4. Call invalidatePlatformCache - verify next call recalculates
5. Monitor performance - verify cached calls are <10ms

**Files Changed:**
- `/Users/mike/gauntlet/tutor-dashboard/services/platform-service.ts` - Add caching

**Notes:**
- Platform metrics are expensive (full table scans with aggregations)
- 5-minute TTL balances freshness with performance
- Cache invalidation can be triggered by webhooks or batch jobs later

---

### PR 3.3: Apply Caching to Tutor Metrics

**Goal:** Cache tutor-specific calculations for detail page performance

**Read these files first:**
- `/Users/mike/gauntlet/tutor-dashboard/lib/cache.ts`
- `/Users/mike/gauntlet/tutor-dashboard/services/tutor-service.ts`

**Tasks:**
- [x] Update `/Users/mike/gauntlet/tutor-dashboard/services/tutor-service.ts`:
- [x] Wrap `getTutorOverallScore` with cache:
  - Use 15-minute TTL
  - Cache key includes tutorId and date range
- [x] Wrap `getTutorRebookRate` with cache:
  - Use 15-minute TTL
- [x] Wrap `getTutorFirstSessionConvertRate` with cache:
  - Use 30-minute TTL (changes infrequently)
- [x] Wrap `getTutorChurnRisk` with cache:
  - Use 15-minute TTL
- [x] Wrap `getTutorStudentEngagement` with cache:
  - Use 15-minute TTL
- [x] Wrap `getTutorAvgStudentRating` with cache:
  - Use 20-minute TTL (feedback comes in slowly)
- [x] Add cache invalidation function:
  - `invalidateTutorCache(tutorId: string)` clears tutor-specific keys
  - Call when tutor completes a new session
- [x] Add JSDoc comments explaining caching

**What to Test:**
1. Build project - verify compilation
2. Call multiple tutor metrics for same tutor - verify caching across functions
3. Call invalidateTutorCache - verify next calls recalculate
4. Test with different tutors - verify cache isolation (tutor A cache doesn't affect tutor B)
5. Monitor performance - tutor detail page should load in <500ms with cache

**Files Changed:**
- `/Users/mike/gauntlet/tutor-dashboard/services/tutor-service.ts` - Add caching

**Notes:**
- Tutor metrics change less frequently than platform metrics
- Longer TTL is acceptable since changes are gradual
- Cache invalidation can be triggered after session completion

---

### PR 3.4: Apply Caching to Student Churn Calculations

**Goal:** Cache expensive churn risk calculations

**Read these files first:**
- `/Users/mike/gauntlet/tutor-dashboard/lib/cache.ts`
- `/Users/mike/gauntlet/tutor-dashboard/services/student-service.ts`

**Tasks:**
- [x] Update `/Users/mike/gauntlet/tutor-dashboard/services/student-service.ts`:
- [x] Wrap `getStudentChurnRiskScore` with cache:
  - Use 20-minute TTL
  - Cache key includes studentId
- [x] Wrap `getStudentChurnFactors` with cache:
  - Use 20-minute TTL (same as risk score)
  - Cache key includes studentId
- [x] Add cache invalidation function:
  - `invalidateStudentCache(studentId: string)` clears student-specific keys
  - Call when student completes a new session or provides feedback
- [x] Add global cache invalidation function:
  - `invalidateChurnAlgorithmCache()` clears all churn calculations
  - Call when algorithm weights are updated
- [x] Add JSDoc comments explaining caching

**What to Test:**
1. Build project - verify compilation
2. Call getStudentChurnRiskScore and getStudentChurnFactors - verify same cache
3. Test invalidateChurnAlgorithmCache - verify all student caches clear
4. Monitor performance - churn risk page should load in <300ms with cache

**Files Changed:**
- `/Users/mike/gauntlet/tutor-dashboard/services/student-service.ts` - Add caching

**Notes:**
- Churn calculations are complex (multiple factors with database queries each)
- Algorithm weight changes invalidate all student caches globally
- Cache TTL can be longer since churn risk changes gradually

---

## Phase 4: Alert & Insight Generation

**Estimated Time:** 3-4 hours

This phase implements the logic for generating alerts and insights based on session data and tutor performance patterns.

### PR 4.1: Alert Service

**Goal:** Create functions to generate and manage tutor alerts

**Read these files first:**
- `/Users/mike/gauntlet/tutor-dashboard/lib/db/schema/alerts.ts`
- `/Users/mike/gauntlet/tutor-dashboard/services/tutor-service.ts`
- `/Users/mike/gauntlet/tutor-dashboard/docs/project_overview.md` (lines 772-789 for alert thresholds)

**Tasks:**
- [x] Create NEW: `/Users/mike/gauntlet/tutor-dashboard/services/alert-service.ts`
- [x] Implement `getActiveAlerts(tutorId: string)`:
  - Query alerts table where resolved = false
  - Order by severity (critical first), then triggered_date DESC
  - Include session link if applicable
  - Return array of `Alert` objects
- [x] Implement `getTutorAlertCount(tutorId: string, severity?)`:
  - Count unresolved alerts, optionally filtered by severity
  - Return number
- [x] Implement `acknowledgeAlert(alertId: string, acknowledgedBy: string)`:
  - Update alert: acknowledged = true, acknowledged_by = userId, acknowledged_at = now
  - Return updated alert
- [x] Implement `resolveAlert(alertId: string, actionTaken: string)`:
  - Update alert: resolved = true, resolved_at = now, action_taken = text
  - Return updated alert
- [x] Implement `checkAndGenerateAlerts(tutorId: string)`:
  - Check all alert conditions for tutor
  - high_talk_ratio: Query last 10 sessions, check if 70%+ have tutor_talk_ratio > 0.65
  - low_understanding_checks: Check if avg < 4 in last 10 sessions
  - poor_first_session: Check any session_number=1 in last 7 days with score < 6.5
  - no_show_pattern: Check if >= 2 no-shows in last 30 days
  - high_reschedule_rate: Check if >= 5 reschedules in last 30 days
  - declining_performance: Check if avg score dropped >15% over last 30 days vs previous 30 days
  - For each condition met, create alert if one doesn't already exist
  - Return array of newly created alerts
- [x] Define TypeScript interfaces

**What to Test:**
1. Build project - verify compilation
2. Call checkAndGenerateAlerts for tutor with high talk ratio - verify alert created
3. Call getActiveAlerts - verify only unresolved alerts returned
4. Call acknowledgeAlert - verify database update
5. Verify duplicate prevention - same alert doesn't create multiple entries

**Files Changed:**
- NEW: `/Users/mike/gauntlet/tutor-dashboard/services/alert-service.ts` - Alert management

**Notes:**
- Alert thresholds are defined in project_overview.md - use exact values
- Prevent duplicate alerts: check if unresolved alert of same type exists before creating
- Link alerts to specific sessions when applicable (e.g., poor_first_session)

---

### PR 4.2: Insight Service

**Goal:** Create functions to generate and retrieve tutor insights (strengths, growth areas)

**Read these files first:**
- `/Users/mike/gauntlet/tutor-dashboard/lib/db/schema/tutors.ts`
- `/Users/mike/gauntlet/tutor-dashboard/services/tutor-service.ts`
- `/Users/mike/gauntlet/tutor-dashboard/docs/project_overview.md` (lines 374-401 for insight categories)

**Tasks:**
- [x] Create NEW: `/Users/mike/gauntlet/tutor-dashboard/services/insight-service.ts`
- [x] Implement `getTutorInsights(tutorId: string, insightType?)`:
  - Query tutor_insights table where is_active = true
  - Filter by insight_type if provided (strength/growth_area/achievement)
  - Order by detected_at DESC
  - Return array of `TutorInsight` objects
- [x] Implement `detectAndGenerateInsights(tutorId: string)`:
  - Query recent sessions (last 30 days)
  - Detect patterns and generate insights:
  - **Strengths:**
    - high_engagement: avg student_engagement_score > 8.0
    - balanced_talk_ratio: tutor_talk_ratio between 0.35-0.50 in 70%+ sessions
    - frequent_understanding_checks: avg > 8 checks per session
    - strong_questioning: > 60% open-ended questions
    - high_visual_aids: tutor_uses_visual_aids in 70%+ sessions
    - positive_reinforcement: avg > 10 reinforcements per session
    - first_session_expert: first session convert rate > 85%
  - **Growth Areas:**
    - low_engagement: avg student_engagement_score < 6.0
    - high_talk_ratio: tutor_talk_ratio > 0.65 in 70%+ sessions
    - infrequent_understanding_checks: avg < 4 per session
    - low_visual_aids: tutor_uses_visual_aids < 30%
  - For each detected pattern, generate display_text (natural language description)
  - Store sample_sessions (array of 3 session IDs that demonstrate pattern)
  - Store metric_value (the calculated value)
  - Deactivate insights that no longer apply (is_active = false)
  - Return array of newly created/updated insights
- [x] Implement `resolveInsight(insightId: string)`:
  - Update insight: is_active = false, resolved_at = now
  - Return updated insight
- [x] Define TypeScript interfaces

**What to Test:**
1. Build project - verify compilation
2. Call detectAndGenerateInsights for tutor with high engagement - verify strength created
3. Verify display_text generation - check natural language quality
4. Call getTutorInsights with type filter - verify filtering works
5. Test insight lifecycle - verify old insights deactivate when pattern no longer applies

**Files Changed:**
- NEW: `/Users/mike/gauntlet/tutor-dashboard/services/insight-service.ts` - Insight generation and management

**Notes:**
- Display text should be actionable and specific (e.g., "Consistently checks understanding 11x per session")
- Sample sessions provide evidence for coaching conversations
- Insights should update periodically (batch job or on-demand when viewing tutor profile)

---

## (SKIP TESTING, ONLY ADD DOCUMENTATION) Phase 5: Testing & Documentation
<!-- 
**Estimated Time:** 2-3 hours

This phase creates comprehensive tests and documentation for the service layer.

### PR 5.1: Service Layer Tests

**Goal:** Create test utilities and sample test cases for service functions

**Read these files first:**
- All service files created in previous PRs -->

<!-- **Tasks:**
- [ ] Create NEW: `/Users/mike/gauntlet/tutor-dashboard/services/__tests__/session-service.test.ts`
- [ ] Set up test utilities:
  - Mock database connection
  - Create test data fixtures (sample sessions, tutors, students)
  - Helper to reset test database state
- [ ] Write tests for session-service:
  - Test getSessionById with valid/invalid IDs
  - Test getSessionsByTutorId with filters
  - Test handling of missing optional metrics
- [ ] Create NEW: `/Users/mike/gauntlet/tutor-dashboard/services/__tests__/tutor-service.test.ts`
- [ ] Write tests for tutor calculations:
  - Test getTutorOverallScore with various session counts
  - Test getTutorChurnRisk threshold logic
  - Test getTutorRebookRate with 0 sessions (should return null)
- [ ] Create NEW: `/Users/mike/gauntlet/tutor-dashboard/services/__tests__/student-service.test.ts`
- [ ] Write tests for churn calculations:
  - Test calculateChurnFactor normalization
  - Test getStudentChurnRiskScore with different student profiles
  - Verify weights sum to 1.0

**What to Test:**
1. Run all tests - verify they pass
2. Test with empty database - verify graceful handling
3. Test edge cases - verify no crashes (null values, division by zero, etc.)
4. Verify type safety - check all return types match interfaces -->
<!-- 
**Files Changed:**
- NEW: `/Users/mike/gauntlet/tutor-dashboard/services/__tests__/session-service.test.ts` - Session service tests
- NEW: `/Users/mike/gauntlet/tutor-dashboard/services/__tests__/tutor-service.test.ts` - Tutor service tests
- NEW: `/Users/mike/gauntlet/tutor-dashboard/services/__tests__/student-service.test.ts` - Student service tests

**Notes:**
- Use Jest or Vitest (check existing test setup in project)
- Mock Drizzle database calls for unit tests
- Integration tests can use test database with seed data -->

---

### PR 5.2: Service Layer Documentation

**Goal:** Document all service functions with JSDoc and create usage examples

**Read these files first:**
- All service files

**Tasks:**
- [x] Add JSDoc comments to all service functions:
  - Function purpose and behavior
  - Parameter descriptions with types
  - Return type description
  - Example usage
  - Notes about caching, performance, edge cases
- [x] Create NEW: `/Users/mike/gauntlet/tutor-dashboard/docs/service_layer_guide.md`
- [x] Document service architecture:
  - Overview of service layer pattern
  - File organization and naming conventions
  - How to use services in Server Components
  - Caching strategy explanation
  - Error handling patterns
- [x] Create usage examples:
  - Fetching platform metrics for dashboard
  - Loading tutor profile with all calculations
  - Calculating student churn risk
  - Generating alerts and insights
- [x] Document performance characteristics:
  - Which functions are cached and TTL values
  - Which queries are expensive (full table scans)
  - Indexing recommendations

**What to Test:**
1. Verify all functions have JSDoc comments
2. Check documentation accuracy - match actual implementation
3. Test example code snippets - verify they work

**Files Changed:**
- All service files - Add JSDoc comments
- NEW: `/Users/mike/gauntlet/tutor-dashboard/docs/service_layer_guide.md` - Service layer documentation

**Notes:**
- JSDoc comments enable IntelliSense in IDEs
- Examples should be copy-paste ready for developers
- Document any non-obvious behavior (e.g., weighted averages, normalization logic)

---

## Summary

This task document provides a comprehensive plan for building Phase 4.1: Platform Metrics & Data Layer. The implementation creates:

1. **Service Layer Architecture** - 6 core service files (session, tutor, student, platform, alert, insight)
2. **Data Access Functions** - Type-safe database queries using Drizzle ORM
3. **Calculation Utilities** - Complex metrics (churn risk, performance scores, platform statistics)
4. **Caching Infrastructure** - In-memory cache with TTL for performance optimization
5. **Alert & Insight Generation** - Automated detection of patterns and issues
6. **Tests & Documentation** - Comprehensive test coverage and usage guides

**Total Estimated Time:** 15-18 hours across 14 PRs in 5 phases

**Key Dependencies for Next Phases:**
- Phase 4.2 (Admin Dashboard) can begin after Phase 1 & 2 complete
- Phase 4.3 (Tutor Detail Page) requires all of Phases 1-4
- Phase 4.4 (Session Detail Page) requires Phase 1 complete
- Phase 4.5 (Student Detail Page) requires Phases 1-3 complete

**Critical Success Factors:**
- All functions handle missing/optional data gracefully
- Caching prevents performance degradation
- Type safety throughout (no `any` types)
- Calculation logic matches specifications in project_overview.md
- Service functions are reusable across all pages
