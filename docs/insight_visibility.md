# Insight Visibility Enhancement Plan

## Problem Statement

**Context:** According to [`project_overview.md`](./project_overview.md#12-key-objectives), the core value proposition of this application is providing "data-driven coaching recommendations" and "actionable insights" to help admins coach tutors and reduce churn.

**Current Issue:** Insights and alerts are functional and being generated, but they're buried 3 clicks deep. Admins cannot see actionable coaching recommendations without manually drilling into each tutor's detail page, defeating the purpose of automated insight generation.

**Business Impact:**
- Poor discoverability reduces coaching intervention speed
- Critical alerts (e.g., poor first sessions, no-show patterns) lack urgency
- Growth opportunities hidden until admin happens to view that tutor
- Contradicts design spec in `project_overview.md` lines 92-106

---

## Current State

### Where Insights/Alerts Appear Today

| Location | What's Shown | What's Hidden |
|----------|-------------|---------------|
| **Main Dashboard**<br>`/dashboard` | Alert count badge (e.g., "2 alerts") | Actual alert content, insight text, severity |
| **Tutors List**<br>`/dashboard/tutors` | Churn risk emoji ⚠️ | All insights, all alerts |
| **Tutor Detail**<br>`/dashboard/tutors/[id]` | ✅ Full insights panel<br>✅ Strengths<br>✅ Growth opportunities<br>✅ Active alerts | N/A - everything is here |

### Data Flow

1. **Generation:** `checkAndGenerateAlerts()` and `detectAndGenerateInsights()` in `services/alert-service.ts` and `services/insight-service.ts`
2. **Storage:** `alerts` and `tutor_insights` tables
3. **Retrieval:**
   - Dashboard: `getTutorsNeedingAttention()` in `services/dashboard.ts` (fetches alert counts only)
   - Detail page: `getTutorInsightsData()` and `getTutorAlertsData()` in `services/tutor-service.ts` (full data)

---

## Proposed Enhancements

### 1. Main Dashboard - Expand "Needs Attention" Section

**File:** `app/dashboard/_components/tutors-needing-attention.tsx`

**Current:** Shows tutor name, score, and alert count badge

**Enhancement:** Show top 1-2 most critical insights/alerts inline for each tutor

**Example:**
```
Isabella Allen (6.2) [!] 1 critical alert
  ⚠️ Poor First Session: scored 5.8/10 with new student
```

**Service Change:** Modify `getTutorsNeedingAttention()` to include top alerts/insights, not just counts

### 2. Main Dashboard - Add "Critical Insights Feed"

**New Component:** `app/dashboard/_components/critical-insights-feed.tsx`

**Location:** Insert between Platform Metrics and Tutor Scoreboard on main dashboard

**Purpose:** Platform-wide view of all critical alerts and top growth opportunities requiring immediate attention

**Features:**
- Shows all critical (severity='critical') unresolved alerts across all tutors
- Sorted by urgency (triggered_date DESC)
- Each item shows: tutor name, alert title, short description, time ago
- Click through to tutor detail page
- Limit to top 10, "View All" link if more exist

**New Service Function:**
- File: `services/dashboard.ts`
- Function: `getCriticalInsightsFeed()` - returns cross-tutor critical alerts + high-impact growth opportunities

### 3. Tutors List - Add Insight/Alert Previews

**File:** `app/dashboard/tutors/page.tsx`

**Current:** Tutor cards show name, score, churn risk emoji, bio

**Enhancement:** Add visual indicators for insights/alerts on each card

**Options:**
- Badge showing "3 insights" with color coding (red for critical alerts, yellow for growth areas, green for strengths)
- Tooltip on hover showing top 1-2 insights
- Small icon indicators (⚠️ for alerts, 💡 for growth areas, ✅ for strengths)

**Service Change:** `getAllTutorsWithMetrics()` already exists, needs to include insight/alert counts per tutor

### 4. Tutor Detail Page - Already Complete

**File:** `app/dashboard/tutors/[id]/page.tsx` (lines 251-374)

**Status:** ✅ Full "Actionable Insights Panel" already implemented with strengths, growth opportunities, and alerts

**No changes needed** - this is the destination for drill-down from other views

---

## Implementation Files

### Components to Modify

```
app/dashboard/_components/tutors-needing-attention.tsx
  └─ Expand to show top alert/insight inline, not just count

app/dashboard/page.tsx
  └─ Add new <CriticalInsightsFeed /> component between metrics and scoreboard

app/dashboard/tutors/page.tsx
  └─ Add insight/alert badges to tutor cards
```

### Components to Create

```
app/dashboard/_components/critical-insights-feed.tsx
  └─ New component for platform-wide critical insights panel
```

### Services to Modify

```
services/dashboard.ts
  ├─ Modify getTutorsNeedingAttention() to return top alerts/insights, not just counts
  └─ Add getCriticalInsightsFeed() for cross-tutor critical alerts

services/tutor-service.ts
  └─ Modify getAllTutorsWithMetrics() to include insight/alert summary counts
```

### Database Queries

All data already exists in:
- `alerts` table (with severity, title, description, triggered_date)
- `tutor_insights` table (with insight_type, category, display_text)

No schema changes required.

---

## Success Criteria

**Visibility:**
- ✅ Critical alerts visible on main dashboard without clicking
- ✅ Insight previews visible on tutors list
- ✅ Admins can identify coaching priorities in < 5 seconds

**Actionability:**
- ✅ One-click navigation from insight to affected tutor
- ✅ Growth opportunities discoverable without browsing each tutor
- ✅ Alert urgency communicated through visual hierarchy

**Performance:**
- ✅ Dashboard load time remains < 2 seconds
- ✅ New queries use existing indexes (tutor_id, severity, resolved)
- ✅ Insight data cached appropriately

---

## Out of Scope (Future Enhancements)

- Email/Slack notifications for critical alerts
- Bulk acknowledge/resolve actions
- Insight filtering and search
- Customizable alert thresholds per tutor
- Historical insight trends

---

## Implementation Summary (2025-11-09)

### ✅ Completed - Option B: Dashboard Restructure + Action Center

**Implemented Features:**

1. **New Action Center Page** (`/dashboard/action-center`)
   - Dedicated page for viewing all alerts and insights across tutors
   - Tabbed interface for Alerts vs Insights
   - Filtering by severity (critical/warning/info) and type (growth_area/strength/achievement)
   - Stats overview showing critical alerts, warnings, growth opportunities, and tutors at risk
   - Clickable cards that navigate to tutor detail pages

2. **Dashboard Enhancements** (`/dashboard`)
   - Added "Critical Alerts Summary" section showing top 5 critical alerts
   - Added "Top Insights Summary" section showing top 5 growth opportunities
   - Both sections positioned prominently between Platform Metrics and Tutor Scoreboard
   - "View All" buttons linking to Action Center with appropriate filters

3. **Navigation Update**
   - Added "Action Center" link to main dashboard navigation
   - Uses AlertCircle icon for visual prominence

4. **New Service Functions** (`services/dashboard.ts`)
   - `getActionableAlerts()` - Fetch alerts with tutor context, filterable by severity
   - `getActionableInsights()` - Fetch insights with tutor context, filterable by type
   - `getActionCenterStats()` - Platform-wide stats for Action Center overview

5. **New Components Created:**
   - `ActionableAlertCard` - Display alert with tutor info, severity badge, timestamp
   - `ActionableInsightCard` - Display insight with tutor info, type badge, category
   - `ActionCenterStats` - Stats grid for Action Center metrics
   - `ActionCenterFilters` - Client-side filter controls
   - `CriticalAlertsSummary` - Dashboard widget for critical alerts
   - `TopInsightsSummary` - Dashboard widget for growth insights

**What the User Can Now Do:**

1. **From Dashboard:** See critical alerts and top growth opportunities immediately without drilling down
2. **From Action Center:** View and filter all alerts and insights across all tutors in one place
3. **Quick Navigation:** Click any alert or insight card to jump to that tutor's detail page
4. **At-a-Glance Status:** See counts of critical alerts, warnings, growth areas, and at-risk tutors

**Files Modified:**
- `/services/dashboard.ts` - Added 3 new service functions and interfaces
- `/app/dashboard/page.tsx` - Restructured to include Critical Alerts and Top Insights summaries
- `/app/dashboard/_components/dashboard-nav.tsx` - Added Action Center navigation link

**Files Created:**
- `/app/dashboard/action-center/page.tsx`
- `/app/dashboard/action-center/_components/actionable-alert-card.tsx`
- `/app/dashboard/action-center/_components/actionable-insight-card.tsx`
- `/app/dashboard/action-center/_components/action-center-stats.tsx`
- `/app/dashboard/action-center/_components/action-center-filters.tsx`
- `/app/dashboard/_components/critical-alerts-summary.tsx`
- `/app/dashboard/_components/top-insights-summary.tsx`

**Build Status:** ✅ Successful (verified with `npm run build`)

---

**Document Created:** 2025-11-09
**Status:** ✅ **IMPLEMENTED** (Option B - Dashboard Restructure + Action Center)
**Related PRD:** [`automated_alert_insight_generation_prd.md`](./Features/automated_alert_insight_generation_prd.md)
