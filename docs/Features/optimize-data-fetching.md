# Data Fetching Optimization Plan

## Problem Statement

The dashboard is experiencing excessive database query counts (reportedly ~100 calls on dashboard reload). Initial investigation suspected redundant fetches across navigation and overly complex data patterns. However, thorough analysis reveals the real issue is **classic N+1 query problems** in specific service functions, not architectural problems with the server component approach.

## Current State Analysis

### What's Actually Happening

**Dashboard Page Query Count:** ~10 queries (acceptable)
- `getPlatformMetrics()`: 7 queries (necessary for current vs previous period trends)
- `getDashboardTopPerformers()`: 1 optimized query with JOIN
- `getTutorsNeedingAttention()`: 2 queries (tutor scores + alert counts)
- `getRecentSessions()`: 1 optimized query with JOINs

**Navigation Pattern:**
- Dashboard layout (`app/dashboard/layout.tsx`) only performs auth check, no data fetching
- Generate sublayout (`app/dashboard/generate/layout.tsx`) adds 1 role check query (acceptable security isolation)
- **No duplicate fetches between parent/child routes** - this is NOT the problem

**Data Volume:**
- ~100 tutors
- ~few hundred sessions
- Small enough that bulk fetches are fast and client-side filtering is viable

### Root Cause: N+1 Query Problems

The excessive queries appear when **specific detail pages** or **calculation functions** are called. These functions loop through result sets and make individual database queries for each item instead of using JOINs or aggregations.

## Critical Issues Identified

### Issue #1: `getTutorFirstSessionConvertRate()` - SEVERE N+1
**Location:** `services/tutor-service.ts:698-750`

**Current Behavior:**
1. Fetches all first sessions for a tutor (1 query)
2. **Loops through each first session**
3. For each first session, queries to check if there's a session_number=2 for that student-tutor pair (N queries)
4. Counts conversions

**Impact:** If tutor has 50 first sessions → **51 database queries**

**What Needs to Change:**
- Replace the loop with a single query using LEFT JOIN or EXISTS subquery
- Match first sessions (session_number=1) with second sessions (session_number=2) in one SQL operation
- Count distinct student_ids with and without matches

**Where This Gets Called:**
- `getTutorDetailById()` in the tutor detail page
- Potentially in reports/analytics

---

### Issue #2: `calculateTutorChurnRiskData()` - Multiple Redundant Queries
**Location:** `services/tutor-service.ts:1060-1128`

**Current Behavior:**
1. Makes separate query for no-shows (1 query)
2. Makes separate query for reschedules (1 query)
3. Makes separate query for late arrivals (1 query)
4. Calculates risk level from results

**Impact:** **3 queries** when 1 would suffice, called on every tutor detail page load

**What Needs to Change:**
- Combine all 3 counts into a single query using `COUNT(CASE WHEN ... THEN 1 END)` pattern
- Calculate all metrics in one database round-trip

**Where This Gets Called:**
- `getTutorDetailById()` via `Promise.all` - called on every tutor detail page

---

### Issue #3: `calculateFirstSessionConvertRate()` (platform-service) - DUPLICATE N+1
**Location:** `services/platform-service.ts:356-399`

**Current Behavior:**
- Same N+1 pattern as Issue #1, but for platform-wide calculation
- Loops through all first sessions across all tutors
- Queries each one individually to check for second session

**Impact:** Platform-wide: could be **hundreds of queries** if this function is called

**What Needs to Change:**
- Use same optimization approach as Issue #1
- **NOTE:** `services/dashboard.ts:126-163` already has an optimized version of this calculation using aggregated CASE statements
- Verify if platform-service version is even being used, or if it's dead code

**Where This Gets Called:**
- Potentially in platform metrics, but dashboard.ts may have replaced it

---

### Issue #4: `calculateTutorChurnRiskCount()` - N+1 Per Tutor
**Location:** `services/platform-service.ts:405-458`

**Current Behavior:**
1. Fetches all tutors (1 query)
2. **Loops through each tutor**
3. For each tutor, queries no-shows (N queries)
4. For each tutor, queries reschedules (N queries)
5. Counts high-risk tutors

**Impact:** If 50 tutors → **101 queries** (1 + 50*2)

**What Needs to Change:**
- Replace loop with single GROUP BY query
- Use `COUNT(CASE WHEN status = 'no_show_tutor' THEN 1 END)` pattern grouped by tutor_id
- Filter high-risk tutors in application logic after single query

**Status:** Appears to be **dead code** - `services/dashboard.ts:166-183` already has optimized version using this exact approach

**Action Required:**
- Verify this function is not called anywhere
- Add deprecation comment or remove entirely

---

## Design Decisions & Architecture

### ✅ Keep Server Components
**Rationale:**
- Current architecture is sound for the data volume
- Next.js Request Memoization prevents duplicate fetches within same render tree
- Server-side rendering provides better SEO and security
- ~100ms page load with optimized queries is fast enough for admin tool

### ✅ Keep Simple Data Flow
**Rationale:**
- Problem is NOT navigation refetches
- Problem is N+1 queries in specific calculation functions
- Server components are fetching correctly, just using wrong query patterns

### ❌ Do NOT Build Client-Side Global State
**Reasons to avoid:**
- Adds complexity (React Context, React Query, cache invalidation logic)
- Minimal benefit given infrequent navigation
- Small dataset doesn't justify the architecture overhead
- Would require rewriting working server components to client components
- Cache invalidation after mutations (e.g., creating sessions in /generate) adds significant complexity

### ❌ Do NOT Fetch Everything Upfront
**Reasons to avoid:**
- Defeats purpose of server components and code splitting
- Would load unused data on every route
- Makes initial page load slower
- Complicates state management and cache invalidation

### ✅ Strategy: Fix N+1, Keep Architecture
**Approach:**
- Replace loops with JOINs and GROUP BY queries
- Keep server component architecture
- Keep per-page data fetching
- Simple, maintainable, performant

---

## Changes Required

### 1. Optimize `getTutorFirstSessionConvertRate()`
**File:** `services/tutor-service.ts:698-750`

**Current Pattern to Replace:**
```
1. Fetch first sessions
2. Loop: for each first session
3.   Query: does this student have session_number=2?
4.   If yes, increment counter
```

**New Pattern:**
```
1. Single query with LEFT JOIN or subquery
2. Match first sessions (session_number=1) to second sessions (session_number=2)
3. Count distinct students with/without matches
4. Calculate conversion rate
```

**Key Concepts:**
- Use `LEFT JOIN sessions AS second_sessions ON first.student_id = second.student_id AND second.session_number = 2`
- Or use `EXISTS` subquery in SELECT
- Count in SQL, not in application code

---

### 2. Optimize `calculateTutorChurnRiskData()`
**File:** `services/tutor-service.ts:1060-1128`

**Current Pattern to Replace:**
```
1. Query no-shows WHERE tutor_id=X AND status='no_show_tutor'
2. Query reschedules WHERE tutor_id=X AND status='rescheduled'
3. Query late arrivals WHERE tutor_id=X AND actual_start > scheduled_start + 5min
```

**New Pattern:**
```
1. Single query with multiple COUNT(CASE...) aggregations
```

**Key Concepts:**
- `COUNT(CASE WHEN status = 'no_show_tutor' THEN 1 END) as no_show_count`
- `COUNT(CASE WHEN status = 'rescheduled' AND rescheduled_by = 'tutor' THEN 1 END) as reschedule_count`
- `COUNT(CASE WHEN actual_start > scheduled_start + INTERVAL '5 minutes' THEN 1 END) as late_count`
- One query, one round-trip, three counts

---

### 3. Verify/Fix `calculateFirstSessionConvertRate()` (platform-service)
**File:** `services/platform-service.ts:356-399`

**Actions:**
1. Grep codebase to see if this function is actually called
2. If used: Apply same fix as #1 (JOIN instead of loop)
3. If unused: Add deprecation comment or remove
4. Note: `services/dashboard.ts:126-163` has optimized version

**Optimized Reference:**
See `dashboard.ts` for working example using aggregation with CASE statements

---

### 4. Deprecate/Remove `calculateTutorChurnRiskCount()`
**File:** `services/platform-service.ts:405-458`

**Actions:**
1. Verify function is not called (check imports and usage)
2. Confirm `services/dashboard.ts:166-183` is used instead
3. Add deprecation comment or remove function entirely

**Why:** Dashboard already has optimized version that does this in one GROUP BY query

---

## Expected Outcomes

### Query Count Improvements

| Page/Function | Before | After | Improvement |
|---------------|--------|-------|-------------|
| Dashboard | ~10 queries | ~10 queries | Already optimal ✅ |
| Tutors List | 1 query | 1 query | Already optimal ✅ |
| Tutor Detail (no N+1) | ~5 queries | ~5 queries | No change needed ✅ |
| **Tutor Detail (with N+1)** | **5-100+ queries** | **~5 queries** | **95% reduction** 🎯 |
| Platform Metrics (if using old functions) | 50-200 queries | ~10 queries | 95% reduction 🎯 |

### Performance Impact
- **Dashboard:** No change (already fast)
- **Tutor detail pages:** Dramatic improvement when viewing tutors with many sessions
- **Platform-wide calculations:** Massive improvement if old platform-service functions were being used
- **Generate page navigation:** No change (single role query is acceptable)

### Code Complexity
- **No increase** - replacing loops with JOINs actually simplifies code
- **No new dependencies** - pure SQL optimization
- **No architecture changes** - server components remain as-is

---

## Implementation Guidelines

### Testing Approach

**Before Making Changes:**
1. Add logging to count queries in affected functions
2. Load tutor detail page for tutor with 20+ first sessions
3. Record baseline query count

**After Changes:**
1. Run same test scenarios
2. Verify query count reduced to expected values
3. Verify results are identical (no logic errors)

**Specific Test Cases:**
- Tutor with 0 first sessions (edge case)
- Tutor with 50+ first sessions (stress test)
- Tutor with mixed conversion (some students have session 2, some don't)
- Platform metrics with 100+ total first sessions

### SQL Pattern Reference

**Converting N+1 to JOIN:**
```sql
-- Instead of loop + query per item:
SELECT student_id FROM sessions WHERE session_number = 1
-- Then for each: SELECT id FROM sessions WHERE student_id = ? AND session_number = 2

-- Do this:
SELECT
  COUNT(DISTINCT fs.student_id) as total_first,
  COUNT(DISTINCT ss.student_id) as converted
FROM sessions fs
LEFT JOIN sessions ss ON
  fs.tutor_id = ss.tutor_id AND
  fs.student_id = ss.student_id AND
  ss.session_number = 2
WHERE fs.tutor_id = ? AND fs.session_number = 1
```

**Converting Multiple Queries to Single Query with CASE:**
```sql
-- Instead of 3 separate COUNT queries with different WHERE clauses:

-- Do this:
SELECT
  COUNT(CASE WHEN condition1 THEN 1 END) as count1,
  COUNT(CASE WHEN condition2 THEN 1 END) as count2,
  COUNT(CASE WHEN condition3 THEN 1 END) as count3
FROM table
WHERE base_conditions
```

### ORM Translation (Drizzle)

The queries use Drizzle ORM. Key patterns:

**Aggregations:**
```typescript
sql<number>`COUNT(CASE WHEN ${sessions.status} = 'no_show_tutor' THEN 1 END)`
```

**Joins:**
```typescript
.leftJoin(sessions, eq(firstSessions.student_id, sessions.student_id))
```

**See existing examples:**
- `services/dashboard.ts:252-268` - Aggregation with JOINs (top performers)
- `services/dashboard.ts:298-337` - Multiple CASE aggregations (tutors needing attention)
- `services/tutor-service.ts:329-348` - GROUP BY with aggregations (getAllTutorsWithMetrics)

---

## Files to Modify

### Primary Changes
1. `services/tutor-service.ts` - Fix `getTutorFirstSessionConvertRate()` and `calculateTutorChurnRiskData()`

### Verification/Cleanup
2. `services/platform-service.ts` - Verify unused functions, add deprecation comments or remove

### No Changes Needed
- ✅ `services/dashboard.ts` - Already optimized
- ✅ `app/dashboard/layout.tsx` - Simple auth, no data fetching
- ✅ `app/dashboard/generate/layout.tsx` - Single role check is acceptable
- ✅ Server component architecture - Keep as-is

---

## Migration Path

### Phase 1: Fix Critical N+1 (High Impact)
1. Optimize `getTutorFirstSessionConvertRate()`
   - Biggest impact on tutor detail pages
   - Test with tutor who has 20+ first sessions

2. Optimize `calculateTutorChurnRiskData()`
   - Affects every tutor detail page load
   - Test with tutors at different risk levels

### Phase 2: Cleanup (Low Impact)
3. Audit `calculateFirstSessionConvertRate()` in platform-service
   - Check if it's actually used
   - Fix or deprecate accordingly

4. Audit `calculateTutorChurnRiskCount()` in platform-service
   - Verify it's replaced by dashboard.ts version
   - Add deprecation comment or remove

### Phase 3: Validation
5. Run validation script to count queries on key pages
6. Load test with production-like data volumes
7. Verify no regressions in calculation accuracy

---

## Future Considerations

### What We're Explicitly NOT Doing (And Why)

**Client-Side Caching (React Query, SWR):**
- Not needed - navigation is infrequent
- Adds complexity for minimal gain
- Would require cache invalidation strategy after mutations
- Server components with optimized queries are fast enough

**Prefetching All Data:**
- Defeats code splitting
- Wastes bandwidth on unused data
- Complicates mutations and cache invalidation
- Small dataset doesn't justify complexity

**Restructuring to Client Components:**
- Loses SEO benefits
- Loses security benefits (data fetching in server)
- Requires client-side state management
- More complex with no performance gain after query optimization

### When to Reconsider Architecture

**Trigger points for more complex caching:**
- Dataset grows to 10,000+ sessions
- Page loads exceed 500ms consistently after query optimization
- Real-time collaborative features requiring shared state
- User navigates between same pages >5 times per minute

**Until then:** Keep it simple. Fix the N+1 queries and call it done.

---

## Success Metrics

### Before Optimization
- Tutor detail page with 50 first sessions: ~51+ queries
- Platform metrics calculation: Potentially 100+ queries
- Churn risk calculation: 3 queries per tutor

### After Optimization
- Tutor detail page: ~5 queries (regardless of first session count)
- Platform metrics: ~10 queries
- Churn risk: 1 query

### Definition of Done
- [ ] All 4 identified functions optimized or deprecated
- [ ] Test cases pass with <10 queries on tutor detail page
- [ ] Calculation results unchanged (accuracy validation)
- [ ] No performance regressions on other pages
- [ ] Code review confirms proper use of JOINs and aggregations
