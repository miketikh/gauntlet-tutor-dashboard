# Automated Alert and Insight Generation

## Overview
Alert and insight detection logic exists in the service layer but is never triggered. This feature adds automation to generate alerts and insights after session completion and includes a backfill script to populate data for existing sessions. Additionally, the main dashboard will be enhanced to prominently surface critical alerts requiring immediate admin attention.

## Current State Analysis

**Files Affected:**
- `/services/alert-service.ts` - Contains `checkAndGenerateAlerts(tutorId)` at line 187 (NEVER CALLED)
- `/services/insight-service.ts` - Contains `detectAndGenerateInsights(tutorId)` at line 79 (NEVER CALLED)
- `/app/dashboard/page.tsx` - Main dashboard that should surface critical alerts
- `/app/dashboard/generate/actions.ts` - Contains `createSession()` server action for session generation
- `/components/ui/alert-card.tsx` - Existing UI component ready to display alerts
- `/lib/db/schema/alerts.ts` - Database schema complete and deployed
- `/lib/db/schema/tutors.ts` - Contains tutor_insights table schema

**Existing Patterns to Leverage:**
- Server actions pattern in `app/dashboard/generate/actions.ts` for async operations
- Script pattern in `scripts/seed-churn-risk.ts` for one-time data operations
- Service layer functions are production-ready, just need triggering
- Alert and insight schemas already deployed to database

**Dependencies & Conflicts:**
- No blocking dependencies - schemas exist, service functions work
- Alert generation runs independently of insight generation
- Both functions are idempotent (won't create duplicates)
- No UI conflicts - alert display components already exist

## Implementation Approach

### Phase 1: Backfill Script
Create a one-time script to generate alerts and insights for all existing tutors based on their session history.

**Changes:**
- Create `/scripts/backfill-alerts-insights.ts`
- Fetch all tutors from database
- For each tutor, call both service functions
- Log progress and summary of alerts/insights created
- Add npm script: `"backfill:alerts": "tsx scripts/backfill-alerts-insights.ts"`

**Script Structure:**
```typescript
// Fetch all tutor IDs
// For each tutor:
//   - Call checkAndGenerateAlerts(tutorId)
//   - Call detectAndGenerateInsights(tutorId)
//   - Log counts
// Print summary statistics
```

**Success Criteria:**
- Script runs without errors
- Alerts generated for tutors matching threshold conditions
- Insights generated for tutors with sufficient session data
- Idempotent (can run multiple times safely)

### Phase 2: Post-Session Automation
Automatically trigger alert and insight generation when a session is completed.

**Changes:**
- Create `/app/dashboard/sessions/actions.ts` with `markSessionComplete()` server action
- Or modify existing session completion logic in generate actions
- After session marked complete, trigger both service functions for the tutor
- Use async/await pattern with error handling

**Integration Point:**
Currently sessions are created via `createSession()` in `/app/dashboard/generate/actions.ts`. Two options:

**Option A (Recommended):** Add trigger directly in `createSession()` after session insert
```typescript
// In createSession() after session creation
if (formData.status === 'completed') {
  // Trigger alert and insight generation
  await checkAndGenerateAlerts(formData.tutorId);
  await detectAndGenerateInsights(formData.tutorId);
}
```

**Option B:** Create separate server action for completing sessions
- More modular but requires updating UI to call new action
- Better separation of concerns but more code changes

**Recommendation:** Option A for simplicity and immediate functionality.

**Success Criteria:**
- New completed sessions automatically trigger alert/insight generation
- Generation happens server-side (not blocking UI)
- Errors logged but don't break session creation
- Tutors see updated alerts/insights on their detail pages

### Phase 3: Dashboard Alert Surfacing
Enhance main dashboard to prominently display critical alerts requiring admin attention.

**Current Dashboard Structure:**
- Platform health metrics bar
- Tutor scoreboard (top performers + needs attention)
- Recent sessions feed

**Proposed Enhancement:**

Add new section: **Active Critical Alerts Panel**

**Location:** Between platform metrics and tutor scoreboard
**Purpose:** Immediate visibility into tutors requiring intervention

**Panel Contents:**
- Title: "Critical Alerts Requiring Attention"
- Badge count showing total critical alerts
- List of tutors with critical alerts (max 5, sorted by alert triggered date)
- Each item shows:
  - Tutor name (linked to detail page)
  - Alert type and severity badge
  - Time since triggered
  - "View Details" link

**Component Structure:**
```
app/dashboard/_components/
  active-alerts-panel.tsx (NEW)
```

**Data Fetching:**
```typescript
// New service function in alert-service.ts
async function getCriticalAlertSummary() {
  // Get all critical, unresolved alerts
  // Group by tutor
  // Return summary with tutor info
}
```

**Visual Design:**
- Prominent placement (hard to miss)
- Red accent border for critical severity
- Compact card format
- Link to tutor detail page where full alerts display

**Alternative Design (Less Invasive):**
Add alert badges to "Tutors Needing Attention" list
- Show alert count next to tutor name
- Use severity colors (red dot for critical)
- Click tutor to see full alert details

**Recommendation:** Start with alert badges in existing "Needs Attention" section, then add dedicated panel if volume warrants it.

**Success Criteria:**
- Admins immediately see which tutors have critical alerts
- One-click navigation to tutor detail page
- Alert count visible without drilling down
- Updates when new alerts generated

## Technical Specifications

### File Changes Summary

**New Files:**
```
/scripts/backfill-alerts-insights.ts
/app/dashboard/_components/active-alerts-panel.tsx (if dedicated panel approach)
```

**Modified Files:**
```
/app/dashboard/generate/actions.ts (add alert/insight triggers)
/services/alert-service.ts (add getCriticalAlertSummary function)
/app/dashboard/page.tsx (add alerts panel or update scoreboard)
/app/dashboard/_components/tutors-needing-attention.tsx (add alert badges)
/package.json (add backfill script)
```

### Backfill Script Details

**File:** `/scripts/backfill-alerts-insights.ts`

```typescript
#!/usr/bin/env tsx
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { config } from 'dotenv';
import { users } from '@/lib/db';
import { checkAndGenerateAlerts } from '@/services/alert-service';
import { detectAndGenerateInsights } from '@/services/insight-service';

config({ path: '.env.local' });

async function backfillAlertsInsights() {
  // Initialize DB connection
  // Fetch all tutors (role = 'tutor')
  // For each tutor:
  //   - Try checkAndGenerateAlerts
  //   - Try detectAndGenerateInsights
  //   - Log results
  // Print summary
}
```

**Run Command:**
```bash
npm run backfill:alerts
```

**Expected Output:**
```
Processing 10 tutors...
Tutor 1/10: Sarah Chen - 2 alerts, 5 insights generated
Tutor 2/10: Michael Torres - 0 alerts, 3 insights generated
...
Summary:
- Total alerts created: 8
- Total insights created: 47
- Tutors with critical alerts: 2
- Tutors with warnings: 3
```

### Post-Session Trigger Implementation

**File:** `/app/dashboard/generate/actions.ts`

**Modification Location:** Inside `createSession()` function, after session insert

**Code Addition:**
```typescript
// After session creation (around line 541)
// Trigger alert and insight generation for completed sessions
if (formData.status === 'completed') {
  try {
    await checkAndGenerateAlerts(formData.tutorId);
    await detectAndGenerateInsights(formData.tutorId);
  } catch (error) {
    // Log error but don't fail session creation
    console.error('Error generating alerts/insights:', error);
  }
}
```

**Import Additions:**
```typescript
import { checkAndGenerateAlerts } from '@/services/alert-service';
import { detectAndGenerateInsights } from '@/services/insight-service';
```

**Error Handling:**
- Wrapped in try-catch to prevent session creation failure
- Errors logged for monitoring
- Non-blocking operation

### Dashboard Alert Display

**Approach 1: Badge in Existing List (Recommended)**

**File:** `/app/dashboard/_components/tutors-needing-attention.tsx`

**Changes:**
- Fetch alert count per tutor using `getTutorAlertCount(tutorId, 'critical')`
- Display badge next to tutor name if count > 0
- Use red badge for critical alerts

**Visual:**
```
Tutors Needing Attention
------------------------
Sarah Chen (6.2)        [!] 2 critical alerts
Michael Torres (6.8)
Alex Johnson (5.9)      [!] 1 critical alert
```

**Approach 2: Dedicated Panel (If High Volume)**

**File:** `/app/dashboard/_components/active-alerts-panel.tsx`

**New Service Function:**
```typescript
// In /services/alert-service.ts
export async function getCriticalAlertSummary() {
  // Query alerts table
  // JOIN with users table for tutor names
  // Filter: severity = 'critical' AND resolved = false
  // Group by tutor
  // Return: tutor info + alert count + most recent alert
}
```

**Component:**
```typescript
export async function ActiveAlertsPanel() {
  const alertSummary = await getCriticalAlertSummary();

  if (alertSummary.length === 0) {
    return null; // Hide panel if no critical alerts
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Critical Alerts <Badge>{total}</Badge></CardTitle>
      </CardHeader>
      <CardContent>
        {alertSummary.map(item => (
          <AlertSummaryCard key={item.tutorId} {...item} />
        ))}
      </CardContent>
    </Card>
  );
}
```

**Placement in Dashboard:**
```typescript
// In /app/dashboard/page.tsx
<PlatformMetricsBar />

<Suspense fallback={<LoadingSkeleton />}>
  <ActiveAlertsPanel /> {/* NEW */}
</Suspense>

<TutorScoreboard />
<RecentSessionsFeed />
```

## Implementation Phases

### Phase 1: Backfill Script (Standalone PR)
**Estimated Effort:** 2 hours

**Tasks:**
1. Create backfill script file
2. Add npm script to package.json
3. Test with subset of tutors
4. Run full backfill
5. Verify alerts/insights in database

**Testing:**
- Run script in dev environment
- Check alert and insight tables for new records
- Verify no duplicate alerts created
- Confirm counts match expectations

**Acceptance Criteria:**
- [ ] Script creates alerts for tutors matching thresholds
- [ ] Script creates insights for tutors with sufficient data
- [ ] Script is idempotent (safe to re-run)
- [ ] Summary output shows meaningful statistics
- [ ] No errors during execution

### Phase 2: Post-Session Automation (Standalone PR)
**Estimated Effort:** 3 hours

**Tasks:**
1. Add service function imports to actions.ts
2. Add trigger logic after session creation
3. Test with new session generation
4. Verify alerts appear on tutor detail page
5. Test error handling

**Testing:**
- Generate new completed session via UI
- Check tutor detail page for new alerts/insights
- Generate session with tutor at threshold (e.g., 2nd no-show)
- Verify critical alert appears
- Test with tutor below threshold (no alert expected)

**Acceptance Criteria:**
- [ ] New completed sessions trigger alert generation
- [ ] New completed sessions trigger insight generation
- [ ] Alerts appear on tutor detail page within seconds
- [ ] Session creation doesn't fail if alert generation fails
- [ ] Logs show successful generation

### Phase 3: Dashboard Alert Display (Standalone PR)
**Estimated Effort:** 4 hours

**Tasks:**
1. Choose approach (badge vs dedicated panel)
2. Implement alert count fetching
3. Add visual indicators to UI
4. Test with multiple alert scenarios
5. Ensure responsive design

**Testing:**
- View dashboard with tutors having critical alerts
- Verify alert badges/panel displays correctly
- Click through to tutor detail page
- Test with zero critical alerts (should hide gracefully)
- Test with many critical alerts (pagination/truncation)

**Acceptance Criteria:**
- [ ] Critical alerts visible on main dashboard
- [ ] One-click navigation to affected tutor
- [ ] Visual design draws attention without being overwhelming
- [ ] Updates when new alerts generated
- [ ] Performance impact negligible (< 100ms query time)

## Edge Cases and Considerations

### Backfill Script
- **Large Dataset:** Script processes tutors sequentially to avoid overwhelming DB
- **Partial Failures:** Continue processing if one tutor fails, log error
- **Re-run Safety:** Service functions check for existing alerts before creating
- **No Sessions:** Tutors with no sessions get no alerts/insights (expected)

### Post-Session Trigger
- **Race Conditions:** Alert service uses transactions to prevent duplicates
- **Performance:** Alert generation takes ~200ms, acceptable for async operation
- **Failed Generation:** Logged but doesn't block session creation
- **Bulk Operations:** If generating many sessions, consider batch mode

### Dashboard Display
- **Volume:** If critical alerts exceed 10, show "View All" link
- **Stale Data:** Cache with 5-minute TTL, acceptable staleness
- **No Alerts:** Panel collapses or shows "No critical alerts" message
- **Permissions:** Only admins see alert panel (role-based rendering)

### Alert Thresholds
- **False Positives:** Thresholds tuned based on 30-day lookback, minimizes noise
- **First Session Bias:** Critical alert for poor first session ensures immediate visibility
- **Resolution Flow:** Admins must explicitly resolve alerts (prevents re-triggering)

## Rollout Plan

### Step 1: Deploy Code (No Immediate Effect)
- Merge Phase 1, 2, 3 PRs to main
- Deploy to production
- No user-facing changes yet (automation not active)

### Step 2: Run Backfill (Controlled)
- Run backfill script during low-traffic period
- Monitor database load
- Verify alert/insight creation
- Check tutor detail pages for accuracy

### Step 3: Monitor Initial Results
- Review generated alerts with admin team
- Validate thresholds are appropriate
- Check for false positives
- Gather feedback on alert usefulness

### Step 4: Enable Live Automation
- Automation already active via code deploy
- New sessions automatically generate alerts
- Monitor alert volume over 1 week
- Adjust thresholds if needed

### Step 5: Dashboard Enhancement
- Dashboard alert surfacing goes live with code deploy
- Train admin team on new panel/badges
- Monitor click-through rates
- Iterate on UI based on feedback

## Success Metrics

### Functional Metrics
- **Alert Generation Rate:** 5-10% of completed sessions trigger alerts
- **Insight Coverage:** 80%+ of tutors have at least one active insight
- **Critical Alert Response Time:** Average < 24 hours from trigger to acknowledgment
- **False Positive Rate:** < 15% of critical alerts marked as "not actionable"

### Performance Metrics
- **Backfill Duration:** Complete in < 5 minutes for 100 tutors
- **Post-Session Latency:** Alert generation adds < 300ms to session completion
- **Dashboard Load Time:** No degradation (stays < 2 seconds)
- **Database Impact:** Alert queries use indexes, < 50ms execution time

### User Experience Metrics
- **Visibility:** 100% of critical alerts visible on dashboard
- **Navigation Efficiency:** Admins reach affected tutor in 1 click
- **Actionability:** 70%+ of critical alerts lead to coaching action
- **Noise Level:** Admins don't feel overwhelmed by alert volume

## Future Enhancements (Out of Scope)

### Alert Notifications
- Email/SMS notifications for critical alerts
- Digest emails summarizing daily alerts
- Slack integration for real-time alerts

### Alert Management
- Bulk acknowledge/resolve actions
- Alert snoozing capability
- Custom alert thresholds per tutor

### Insight Evolution
- Machine learning for pattern detection
- Personalized coaching recommendations
- Trend analysis across tutor cohorts

### Advanced Dashboard Features
- Alert filtering and search
- Historical alert trends
- Alert resolution analytics
- Export alerts to CSV

## Appendix: Alert Types Reference

### Critical Alerts (Require Immediate Action)
1. **poor_first_session** - First session score < 6.5 within 7 days
2. **no_show_pattern** - 2+ tutor no-shows in 30 days

### Warning Alerts (Monitor and Coach)
3. **high_talk_ratio** - Tutor talks > 65% in 70%+ of sessions
4. **low_understanding_checks** - Average < 4 checks per session
5. **high_reschedule_rate** - 5+ tutor-initiated reschedules in 30 days
6. **declining_performance** - Session scores drop > 15% over 30 days

### Insight Categories

**Strengths (7 types):**
- high_engagement (avg student engagement > 8.0)
- balanced_talk_ratio (35-50% in 70%+ sessions)
- frequent_understanding_checks (avg > 8 per session)
- strong_questioning (> 60% open-ended questions)
- high_visual_aids (used in 70%+ sessions)
- positive_reinforcement (avg > 10 per session)
- first_session_expert (85%+ convert rate)

**Growth Areas (4 types):**
- low_engagement (avg student engagement < 6.0)
- high_talk_ratio (> 65% in 70%+ sessions)
- infrequent_understanding_checks (avg < 4 per session)
- low_visual_aids (used in < 30% sessions)

## Document Metadata
- **Feature:** Automated Alert and Insight Generation
- **Priority:** High
- **Complexity:** Medium
- **Dependencies:** None (schemas deployed)
- **Estimated Total Effort:** 9 hours (3 phases)
- **Target Audience:** Admin users
- **Author:** PRD Writer Agent
- **Date:** 2025-11-09
