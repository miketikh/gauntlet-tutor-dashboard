# Tutor Detail Page - Implementation Tasks

## Context

Phase 4.3 creates the comprehensive Tutor Detail Page (`/tutors/[id]`), a critical interface for administrators to analyze individual tutor performance, identify coaching opportunities, and track intervention effectiveness. This page provides forensic-level analysis of a tutor's session history, performance trends, and actionable insights.

The Tutor Detail Page is one of the most complex and data-rich pages in the system. It aggregates data from multiple sources: session scores, audio/video metrics, student feedback, alert history, and coaching notes. The page must handle scenarios where tutors are new (minimal data), where metrics are partially available (video/screen monitoring optional), and where performance is improving or declining over time.

This implementation builds on Phase 4.1 (Platform Metrics & Data Layer) which provides tutor data retrieval and calculation services, and Phase 3 (Reusable Components) which provides PerformanceChart, ScoreBadge, RiskBadge, AlertCard, SessionCard, DataTable, and layout components. The page uses Next.js 15 App Router with Server Components for initial data fetching and TanStack Query for client-side navigation caching.

**Design Specifications (from project_overview.md lines 69-123):**

The Tutor Detail Page has 5 main sections:
1. **Tutor Header** - Profile, overall score, and quick stats grid
2. **Performance Trends** - 30-day line chart with 3 metrics
3. **Actionable Insights Panel** - Strengths, Growth Opportunities, Active Alerts
4. **Session History Table** - Sortable/filterable list of all sessions
5. **Coaching Notes Section** - Timestamped log of interventions

**Critical Display Logic Rules (project_overview.md lines 119-123):**
- **Rating vs Score Divergence**: If `abs(student_rating * 2 - overall_score) > 2.0`, display warning badge
- **Churn Risk**: Color-coded based on no-show patterns and reschedule frequency
- **Alert Badges**: Count of unacknowledged alerts with severity indicators

## Instructions for AI Agent

**Standard Workflow:**
1. **Read Phase**: Start each PR by reading all files listed in tasks to understand current implementation
2. **Implement Tasks**: Complete tasks in order, grouping related changes together
3. **Mark Complete**: Mark each task with [x] when finished
4. **Test**: Follow the "What to Test" section to validate your changes
5. **Summary**: Provide a completion summary listing files changed and key functionality added
6. **Wait for Approval**: Do not proceed to the next PR until the current one is approved

**File Organization:**
- Page component: `/Users/mike/gauntlet/tutor-dashboard/app/tutors/[id]/page.tsx`
- Client components: `/Users/mike/gauntlet/tutor-dashboard/components/tutors/` (if needed for interactivity)
- Services: Use existing `/Users/mike/gauntlet/tutor-dashboard/services/tutor-service.ts` from Phase 4.1
- Types: Use `/Users/mike/gauntlet/tutor-dashboard/lib/db/types.ts`

**Architecture Pattern:**
- Server Component for page.tsx (fetches initial data)
- Use services from Phase 4.1 for all data access
- Use components from Phase 3 for all UI elements
- Client components only for interactive features (filters, modals)
- No direct database queries in page components

---

## Phase 4.3: Tutor Detail Page Implementation

**Estimated Time:** 6-8 hours

This phase creates the full tutor detail page with all 5 sections and interactive features.

### PR 4.3.1: Tutor Service Enhancements

**Goal:** Extend tutor-service.ts with all data retrieval functions needed for the detail page

**Tasks:**
- [ ] Read `/Users/mike/gauntlet/tutor-dashboard/services/tutor-service.ts` to understand existing functions
- [ ] Read `/Users/mike/gauntlet/tutor-dashboard/lib/db/schema/tutors.ts` for tutor data structures
- [ ] Read `/Users/mike/gauntlet/tutor-dashboard/lib/db/schema/alerts.ts` for alert structures
- [ ] Read `/Users/mike/gauntlet/tutor-dashboard/docs/project_overview.md` lines 69-123 for exact requirements
- [ ] Update `/Users/mike/gauntlet/tutor-dashboard/services/tutor-service.ts`:
  - Add `getTutorDetailById(tutorId: string)` function that returns:
    - User info (name, email, avatar, role)
    - Tutor profile (member_since, bio, subjects, hourly_rate)
    - Calculated metrics: overall_score, total_sessions, avg_student_rating, avg_student_engagement, rebook_rate
    - Churn risk: tutor_churn_risk level, no_show_count_30d, reschedule_count_30d, late_count_30d
    - Rating divergence: rating_score_divergence value
  - Add `getTutorPerformanceTrends(tutorId: string, days: number = 30)` function that returns:
    - Array of daily aggregates with: date, avg_session_score, avg_engagement_score, avg_student_satisfaction
    - Use tutor_performance_snapshots if available, otherwise calculate from sessions
    - Fill gaps in data with null (chart handles gracefully)
  - Add `getTutorInsights(tutorId: string)` function that returns:
    - Strengths: insights where insight_type = 'strength' and is_active = true
    - Growth opportunities: insights where insight_type = 'growth_area' and is_active = true
    - Include display_text, category, detected_at, metric_value, sample_sessions
  - Add `getTutorAlerts(tutorId: string, includeResolved: boolean = false)` function that returns:
    - Active alerts: where acknowledged = false OR resolved = false
    - Optional: include resolved alerts if includeResolved = true
    - Order by severity (critical, warning, info) then triggered_date DESC
    - Include alert_type, title, description, session_id, triggered_date
- [ ] Add TypeScript interfaces at top of file for all return types:
  - `TutorDetailData` interface
  - `TutorPerformanceTrend` interface (date, sessionScore, engagement, satisfaction)
  - `TutorInsight` interface
  - `TutorAlert` interface
- [ ] Implement calculation logic for tutor_churn_risk based on counts:
  - Low: no_show_count_30d = 0 AND reschedule_count_30d < 2
  - Medium: no_show_count_30d = 1 OR reschedule_count_30d >= 2
  - High: no_show_count_30d >= 2 OR reschedule_count_30d >= 4
- [ ] Implement rating_score_divergence calculation:
  - Formula: `abs((avg_student_rating * 2) - overall_score)`
  - Only calculate if avg_student_rating exists (some tutors have no ratings)

**What to Test:**
1. Build project - verify no TypeScript errors
2. Call getTutorDetailById with a seeded tutor ID - verify all fields populate
3. Call getTutorPerformanceTrends with 30 days - verify array of trends returned
4. Call getTutorInsights - verify strengths and growth areas separated correctly
5. Call getTutorAlerts - verify only active alerts returned by default
6. Test with tutor who has minimal data - ensure no crashes, graceful defaults

**Files Changed:**
- `/Users/mike/gauntlet/tutor-dashboard/services/tutor-service.ts` - Extended with detail page functions

**Notes:**
- Use Drizzle's `sql` template for complex aggregations if needed
- Performance snapshots table should be used when available to avoid expensive real-time calculations
- All calculations must handle null/undefined gracefully (tutors with no sessions yet)
- rating_score_divergence threshold of 2.0 is significant (project_overview.md line 120)

---

### PR 4.3.2: Tutor Detail Page - Header and Quick Stats

**Goal:** Create page route and implement tutor header with profile and stats grid

**Tasks:**
- [ ] Read `/Users/mike/gauntlet/tutor-dashboard/app/dashboard/page.tsx` to understand header patterns
- [ ] Read `/Users/mike/gauntlet/tutor-dashboard/components/ui/page-header.tsx` for header component
- [ ] Read `/Users/mike/gauntlet/tutor-dashboard/components/ui/stat-grid.tsx` for stats grid
- [ ] Read `/Users/mike/gauntlet/tutor-dashboard/components/ui/score-badge.tsx` for score display
- [ ] Read `/Users/mike/gauntlet/tutor-dashboard/components/ui/risk-badge.tsx` for risk display
- [ ] Create NEW: `/Users/mike/gauntlet/tutor-dashboard/app/tutors/[id]/page.tsx` with:
  - Server Component that fetches data using getTutorDetailById
  - Proper error handling for invalid tutor IDs (redirect or 404)
  - Check user is authenticated (use Supabase auth)
- [ ] Implement tutor header section with:
  - Name, email (if available), avatar placeholder (use User icon from lucide-react)
  - Overall score displayed with large ScoreBadge component
  - Member since date formatted with date-fns (e.g., "Member since Jan 2024")
  - Contact button (Button with Mail icon) - onClick handler placeholder for future
- [ ] Implement quick stats grid below header using StatGrid component:
  - Total Sessions: numeric value
  - Avg Student Rating: star display (5-star scale) with value, show "N/A" if no ratings
  - Student Engagement Score: ScoreBadge with 0-10 scale
  - Rebook Rate: percentage with trend indicator if available
  - Churn Risk Level: RiskBadge with tutor_churn_risk level
- [ ] Add rating divergence warning badge if threshold exceeded:
  - Display only if `rating_score_divergence > 2.0`
  - Badge with AlertTriangle icon and text "Rating/Score Mismatch"
  - Tooltip explaining divergence (future enhancement)
- [ ] Style page with consistent spacing using Tailwind classes:
  - Container with max-width and padding
  - Proper gap between header and stats
  - Responsive design (stack on mobile, grid on desktop)

**What to Test:**
1. Build project - verify no compilation errors
2. Navigate to `/tutors/[valid-id]` - verify header and stats render with real data
3. Test with tutor who has no ratings - verify "N/A" displays correctly
4. Test with tutor who has rating divergence > 2.0 - verify warning badge shows
5. Test with high churn risk tutor - verify RiskBadge shows red/high
6. Test responsive behavior on mobile - verify stats stack properly

**Files Changed:**
- NEW: `/Users/mike/gauntlet/tutor-dashboard/app/tutors/[id]/page.tsx` - Tutor detail page
- `/Users/mike/gauntlet/tutor-dashboard/app/tutors/[id]/layout.tsx` - Layout if needed (optional)

**Notes:**
- Use PageHeader component from Phase 3 for consistent header styling
- Avatar placeholder: use `<div className="rounded-full bg-muted flex items-center justify-center"><User className="h-8 w-8" /></div>`
- Star rating display: can use simple "★" characters or create StarRating component
- This PR establishes page structure; subsequent PRs add more sections

---

### PR 4.3.3: Performance Trends Chart Section

**Goal:** Add 30-day performance trends visualization below header

**Tasks:**
- [ ] Read `/Users/mike/gauntlet/tutor-dashboard/components/ui/performance-chart.tsx` for chart component
- [ ] Read `/Users/mike/gauntlet/tutor-dashboard/components/ui/section-container.tsx` for section wrapper
- [ ] Read `/Users/mike/gauntlet/tutor-dashboard/components/ui/trend-indicator.tsx` for trend display
- [ ] Update `/Users/mike/gauntlet/tutor-dashboard/app/tutors/[id]/page.tsx`:
  - Fetch performance trends data using getTutorPerformanceTrends(tutorId, 30)
  - Add Performance Trends section after quick stats grid
- [ ] Implement section with SectionContainer component:
  - Title: "Performance Trends (Last 30 Days)"
  - Description: "Track session quality, engagement, and satisfaction over time"
- [ ] Render PerformanceChart component with:
  - Data: trends array from getTutorPerformanceTrends
  - Metrics: ["sessionScore", "engagement", "satisfaction"] (all 3 lines)
  - Height: 300px or responsive
  - Title passed to chart component (optional)
- [ ] Add trend indicators above chart showing overall trends:
  - Calculate trend for each metric (compare avg of last 7 days vs previous 7 days)
  - Display 3 TrendIndicator components horizontally (Session Score, Engagement, Satisfaction)
  - Direction: "up" if improved, "down" if declined, "neutral" if within ±0.3 points
  - Value: show change amount (e.g., "+0.8" or "-0.4")
- [ ] Handle edge cases:
  - New tutors with < 30 days of data: display partial chart with message
  - Tutors with no sessions: show EmptyState component with helpful message
  - Missing data points: chart should handle gaps gracefully (Recharts connectNulls prop)

**What to Test:**
1. Build project - verify chart renders without errors
2. Test with tutor who has 30+ days of data - verify all 3 lines show correctly
3. Test with new tutor (< 30 days) - verify partial chart displays
4. Test with tutor who has gaps in data - verify chart connects or shows gaps appropriately
5. Test trend indicators - verify correct direction (up/down/neutral) based on recent data
6. Verify chart colors match design: sessionScore (blue), engagement (purple), satisfaction (green)

**Files Changed:**
- `/Users/mike/gauntlet/tutor-dashboard/app/tutors/[id]/page.tsx` - Added performance trends section

**Notes:**
- Use date-fns for date calculations when comparing 7-day averages
- Recharts PerformanceChart should use ResponsiveContainer for mobile responsiveness
- Trend threshold of ±0.3 is arbitrary but reasonable (can be adjusted)
- If no trends data, show message "Not enough data yet - complete more sessions to see trends"

---

### PR 4.3.4: Actionable Insights Panel

**Goal:** Display strengths, growth opportunities, and active alerts in organized panel

**Tasks:**
- [ ] Read `/Users/mike/gauntlet/tutor-dashboard/components/ui/alert-card.tsx` for alert display
- [ ] Read `/Users/mike/gauntlet/tutor-dashboard/components/ui/two-column-layout.tsx` for layout
- [ ] Read `/Users/mike/gauntlet/tutor-dashboard/docs/project_overview.md` lines 92-107 for exact section specs
- [ ] Update `/Users/mike/gauntlet/tutor-dashboard/app/tutors/[id]/page.tsx`:
  - Fetch insights data using getTutorInsights(tutorId)
  - Fetch alerts data using getTutorAlerts(tutorId, false)
  - Add Actionable Insights Panel section after Performance Trends
- [ ] Implement panel with TwoColumnLayout or three-section layout:
  - **Strengths Section** (left or top):
    - Green header with CheckCircle icon and "Strengths" title
    - Bullet list of strengths from insights
    - Each item: display_text with optional metric_value in parentheses
    - Example: "Consistently checks understanding (avg 11x/session)"
    - Show up to 5 strengths, link to "View All" if more
  - **Growth Opportunities Section** (middle):
    - Yellow/orange header with Lightbulb icon and "Growth Opportunities" title
    - Bullet list of growth areas from insights
    - Each item: display_text with constructive phrasing
    - Example: "Visual aids usage low (2/10 sessions) - Consider whiteboard"
    - Show up to 5 opportunities
  - **Active Alerts Section** (right or bottom):
    - Red header with AlertTriangle icon and "Active Alerts" title
    - Display only if alerts exist (hide section if empty)
    - Use AlertCard component for each alert
    - Show alert severity, title, triggered date
    - Include link to flagged session if session_id present
    - "Acknowledge" and "Resolve" button placeholders (handlers in future PR)
- [ ] Handle empty states for each section:
  - Strengths: "Complete more sessions to identify strengths"
  - Growth: "No specific growth areas identified - keep up the great work!"
  - Alerts: Hide section entirely if no active alerts
- [ ] Add visual separators between sections using border or Card components

**What to Test:**
1. Build project - verify sections render correctly
2. Test with tutor who has strengths and growth areas - verify both lists populate
3. Test with tutor who has active alerts - verify AlertCard components display
4. Test with new tutor (no insights) - verify empty state messages appear
5. Test responsive behavior - verify layout adapts on mobile (stack sections)
6. Verify colors: strengths (green), growth (yellow), alerts (red based on severity)

**Files Changed:**
- `/Users/mike/gauntlet/tutor-dashboard/app/tutors/[id]/page.tsx` - Added insights panel section

**Notes:**
- Insights come from tutor_insights table (populated by Phase 4.1 analytics)
- Growth opportunities should be constructive, not punitive
- Alert acknowledge/resolve handlers will be implemented in Phase 5 (interactivity)
- Use sample_sessions field from insights to show "View Examples" links (future)

---

### PR 4.3.5: Session History Table

**Goal:** Create comprehensive, sortable, filterable table of all tutor sessions

**Tasks:**
- [ ] Read `/Users/mike/gauntlet/tutor-dashboard/components/ui/data-table.tsx` for table component
- [ ] Read `/Users/mike/gauntlet/tutor-dashboard/components/ui/filter-bar.tsx` for filtering
- [ ] Read `/Users/mike/gauntlet/tutor-dashboard/components/ui/session-card.tsx` for mobile view
- [ ] Read `/Users/mike/gauntlet/tutor-dashboard/services/session-service.ts` for getSessionsByTutorId
- [ ] Update `/Users/mike/gauntlet/tutor-dashboard/app/tutors/[id]/page.tsx`:
  - Fetch session history using getSessionsByTutorId(tutorId)
  - Add Session History section after Actionable Insights Panel
- [ ] Create client component NEW: `/Users/mike/gauntlet/tutor-dashboard/components/tutors/session-history-table.tsx`:
  - Client component for interactivity (sorting, filtering, pagination)
  - Receives sessions data as props from server component
  - Use DataTable component from Phase 3
- [ ] Define table columns:
  - Date/Time: formatted with date-fns (e.g., "Nov 7, 2:00 PM")
  - Subject: subject name from join
  - Student: anonymized ID or student number
  - Session #: session_number (nth session with this student)
  - Overall Score: ScoreBadge component
  - Engagement: numeric score with color coding
  - Student Rating: star display if feedback exists, "N/A" if no feedback
  - Status: badge for status (completed, cancelled, no-show, etc.)
- [ ] Implement FilterBar above table with:
  - Subject filter: dropdown of all subjects tutor teaches
  - Date range filter: presets (7d, 30d, 90d, all time)
  - Status filter: dropdown (all, completed only, flagged only)
  - Student filter: search/select student ID (if many students)
  - "Reset Filters" button
- [ ] Implement sorting:
  - Default: most recent first (scheduled_start DESC)
  - Sortable columns: Date, Score, Engagement, Rating
  - Use DataTable's built-in sort handling
- [ ] Add row click handler:
  - Navigate to `/sessions/[sessionId]` when row clicked
  - Use Next.js router.push for client-side navigation
- [ ] Implement pagination if > 50 sessions:
  - Show 25 sessions per page
  - Pagination controls at bottom
  - Update URL params for pagination state
- [ ] Mobile responsive design:
  - Desktop: full DataTable
  - Mobile: switch to SessionCard grid view (stack vertically)
  - Use Tailwind responsive classes: `hidden md:block` and `block md:hidden`

**What to Test:**
1. Build project - verify table renders with data
2. Test sorting on each sortable column - verify order changes correctly
3. Test filters - apply subject filter, verify only matching sessions show
4. Test date range filter - select "Last 7 Days", verify only recent sessions
5. Test pagination - if > 50 sessions, verify page controls work
6. Test row click - click session, verify navigation to session detail page
7. Test mobile view - resize browser, verify switch to card view
8. Test with tutor who has 0 sessions - verify EmptyState displays

**Files Changed:**
- `/Users/mike/gauntlet/tutor-dashboard/app/tutors/[id]/page.tsx` - Added session history section
- NEW: `/Users/mike/gauntlet/tutor-dashboard/components/tutors/session-history-table.tsx` - Interactive table

**Notes:**
- This is a client component due to interactivity (sorting, filtering)
- Data is passed from server component as props (not fetched in client component)
- Use TanStack Table (@tanstack/react-table) under the hood via DataTable component
- FilterBar should persist state in URL params for shareability
- Mobile card view provides better UX than horizontal scrolling table

---

### PR 4.3.6: Coaching Notes Section

**Goal:** Display timestamped log of coaching interventions and system-generated insights

**Tasks:**
- [ ] Read `/Users/mike/gauntlet/tutor-dashboard/lib/db/schema/tutors.ts` to check if coaching_notes table exists
- [ ] Read `/Users/mike/gauntlet/tutor-dashboard/docs/database_schema.md` for notes schema (if exists)
- [ ] If coaching_notes table doesn't exist, create migration:
  - Table: coaching_notes
  - Columns: id (UUID PK), tutor_id (FK), note_type (enum: 'manual', 'system'), content (TEXT), created_by (user_id FK nullable), created_at (TIMESTAMP)
  - Note types: 'manual' for admin-entered notes, 'system' for auto-generated insights
- [ ] Update `/Users/mike/gauntlet/tutor-dashboard/services/tutor-service.ts`:
  - Add `getCoachingNotes(tutorId: string)` function
  - Returns array of notes ordered by created_at DESC
  - Join with users table to get admin name for manual notes
- [ ] Update `/Users/mike/gauntlet/tutor-dashboard/app/tutors/[id]/page.tsx`:
  - Fetch coaching notes using getCoachingNotes(tutorId)
  - Add Coaching Notes section at bottom of page
- [ ] Implement section with SectionContainer:
  - Title: "Coaching Notes & Intervention Log"
  - Description: "Track coaching conversations and system-generated insights"
  - Action button: "Add Note" (placeholder, handler in future)
- [ ] Render notes as timeline:
  - Each note card with: timestamp, author (admin name or "System"), content
  - Visual timeline connector (vertical line with dots)
  - System notes styled differently (muted background) than manual notes
  - Most recent at top
- [ ] Add placeholder for "Add Note" functionality:
  - Button opens dialog (Dialog component from Phase 3)
  - Form with textarea for note content
  - Submit button (handler placeholder - will use Server Action in Phase 5)
  - Cancel button to close dialog
- [ ] Handle empty state:
  - If no notes, show message: "No coaching notes yet. Add the first note to track interventions."
  - EmptyState component with FileText icon

**What to Test:**
1. Build project - verify notes section renders
2. Test with tutor who has coaching notes - verify timeline displays correctly
3. Test timestamp formatting - verify relative time (e.g., "2 days ago")
4. Test visual distinction between system and manual notes
5. Test "Add Note" button - verify dialog opens (even if submit doesn't work yet)
6. Test with tutor who has no notes - verify empty state shows

**Files Changed:**
- `/Users/mike/gauntlet/tutor-dashboard/app/tutors/[id]/page.tsx` - Added coaching notes section
- `/Users/mike/gauntlet/tutor-dashboard/services/tutor-service.ts` - Added getCoachingNotes function
- `/Users/mike/gauntlet/tutor-dashboard/lib/db/schema/tutors.ts` - Added coaching_notes schema (if needed)
- NEW migration file: `supabase/migrations/XXXX_add_coaching_notes.sql` (if table doesn't exist)

**Notes:**
- Coaching notes is critical for tracking admin interventions over time
- System notes can be auto-generated when alerts are acknowledged/resolved
- Timeline design: use CSS pseudo-elements for vertical line and dots
- Form submission will be implemented in Phase 5 using Server Actions
- Consider adding rich text editor in future for formatted notes

---

### PR 4.3.7: Navigation & Integration

**Goal:** Add navigation to tutor detail page from other pages and implement breadcrumbs

**Tasks:**
- [ ] Read `/Users/mike/gauntlet/tutor-dashboard/app/dashboard/page.tsx` to understand dashboard structure
- [ ] Read `/Users/mike/gauntlet/tutor-dashboard/components/ui/page-header.tsx` for breadcrumb support
- [ ] Update `/Users/mike/gauntlet/tutor-dashboard/app/tutors/[id]/page.tsx`:
  - Add breadcrumb navigation to PageHeader:
    - Home → Tutors → [Tutor Name]
    - Links: "/" → "/tutors" → current page
  - Add "Back to Tutors" button in page actions area
- [ ] Create `/Users/mike/gauntlet/tutor-dashboard/app/tutors/page.tsx` (tutors list page):
  - Simple list/grid of all tutors with ScoreBadge and basic stats
  - Click tutor card to navigate to `/tutors/[id]`
  - Use StatGrid component for layout
  - This is simplified version - full implementation in Phase 4.2
- [ ] Update dashboard to include link to tutors:
  - In header navigation or sidebar (if exists)
  - Or in dashboard cards with "View All Tutors" link
- [ ] Add "View Sessions" quick link in tutor detail header:
  - Links to `/sessions?tutor=[tutorId]` (filtered sessions list)
  - Sessions list page simplified placeholder for now
- [ ] Add back/forward navigation support:
  - Use Next.js Link component for all navigation
  - Ensure browser back button works correctly
  - Use TanStack Query for client-side caching (optional enhancement)
- [ ] Test navigation flow:
  - Dashboard → Tutors List → Tutor Detail
  - Tutor Detail → Session (click session row) → Back to Tutor Detail
  - Breadcrumb navigation at each step

**What to Test:**
1. Build project - verify all navigation links work
2. Navigate from dashboard to tutors list - verify list renders
3. Click tutor in list - verify detail page loads with correct tutor data
4. Click breadcrumb "Tutors" - verify return to list
5. Click session in history table - verify navigation to session detail (placeholder OK)
6. Use browser back button - verify navigation history works
7. Test URL structure: `/tutors/[id]` where id is tutor user_id

**Files Changed:**
- `/Users/mike/gauntlet/tutor-dashboard/app/tutors/[id]/page.tsx` - Added breadcrumbs and navigation
- NEW: `/Users/mike/gauntlet/tutor-dashboard/app/tutors/page.tsx` - Tutors list page (simplified)
- `/Users/mike/gauntlet/tutor-dashboard/app/dashboard/page.tsx` - Added tutors link (if needed)

**Notes:**
- Breadcrumbs use PageHeader component's breadcrumbs prop
- Tutors list page is minimal for now - full featured list in Phase 4.2
- Session detail page placeholder is OK - full implementation in Phase 4.4
- TanStack Query can cache tutor data for fast navigation between pages
- Ensure all links use Next.js Link for client-side navigation (no full page reloads)

---

### PR 4.3.8: Polish & Error Handling

**Goal:** Add loading states, error boundaries, and final polish

**Tasks:**
- [ ] Read `/Users/mike/gauntlet/tutor-dashboard/components/ui/loading-card.tsx` for loading states
- [ ] Read `/Users/mike/gauntlet/tutor-dashboard/app/dashboard/page.tsx` for error handling patterns
- [ ] Create `/Users/mike/gauntlet/tutor-dashboard/app/tutors/[id]/loading.tsx`:
  - Next.js 15 loading UI file (automatic loading state)
  - Show skeleton for: header, stats grid, chart, insights panel, table
  - Use LoadingCard components with appropriate variants
  - Match layout of actual page for smooth transition
- [ ] Create `/Users/mike/gauntlet/tutor-dashboard/app/tutors/[id]/error.tsx`:
  - Next.js 15 error boundary UI
  - Display user-friendly error message
  - "Retry" button to reload page
  - "Back to Tutors" button for navigation
  - Log error to console for debugging
- [ ] Update `/Users/mike/gauntlet/tutor-dashboard/app/tutors/[id]/page.tsx`:
  - Add null checks for tutor not found
  - If tutor doesn't exist, show EmptyState with 404 message
  - Handle service errors gracefully with try/catch
  - Add Suspense boundaries around heavy sections (chart, table)
- [ ] Add metadata to page.tsx:
  - Dynamic metadata with tutor name in title
  - Example: `export async function generateMetadata({ params })`
  - Title: "Tutor Name - Performance Analysis | TutorReview"
  - Description: tutor bio snippet or default description
- [ ] Performance optimizations:
  - Ensure service functions are cached appropriately
  - Use React.cache() for service calls if multiple components need same data
  - Minimize client-side JavaScript (keep most components as Server Components)
- [ ] Accessibility improvements:
  - Proper heading hierarchy (h1 for tutor name, h2 for sections)
  - ARIA labels for interactive elements
  - Keyboard navigation for table and filters
  - Color contrast checks for all badges and alerts
- [ ] Final visual polish:
  - Consistent spacing between sections (use Tailwind space-y classes)
  - Responsive design review (mobile, tablet, desktop)
  - Loading states smooth transitions
  - Empty states are informative and helpful

**What to Test:**
1. Build project - verify no errors or warnings
2. Test loading state - navigate to tutor detail, verify skeleton appears briefly
3. Test error handling - use invalid tutor ID, verify error page shows
4. Test 404 case - use non-existent tutor ID, verify EmptyState displays
5. Test metadata - view page source, verify title and description are dynamic
6. Test accessibility - tab through page with keyboard, verify all interactive elements reachable
7. Test responsive design - resize browser to mobile, tablet, desktop - verify layouts adapt
8. Performance test - check Chrome DevTools, verify no unnecessary re-renders

**Files Changed:**
- `/Users/mike/gauntlet/tutor-dashboard/app/tutors/[id]/page.tsx` - Added metadata, error handling, polish
- NEW: `/Users/mike/gauntlet/tutor-dashboard/app/tutors/[id]/loading.tsx` - Loading state UI
- NEW: `/Users/mike/gauntlet/tutor-dashboard/app/tutors/[id]/error.tsx` - Error boundary UI

**Notes:**
- Next.js 15 automatically uses loading.tsx and error.tsx for route
- Suspense boundaries allow partial page loading (sections load independently)
- React.cache() is useful for deduplicating service calls in Server Components
- Accessibility is important - use semantic HTML and ARIA where needed
- Loading skeletons should match actual content shape for smooth UX

---

## Deliverable Checklist

After completing all PRs, verify:
- [ ] Page displays all 5 sections correctly (header, trends, insights, sessions, notes)
- [ ] All data pulls from Phase 4.1 services (no direct database queries in page)
- [ ] All UI uses Phase 3 components (no custom styled divs)
- [ ] Dynamic routing works: `/tutors/[id]` accepts any valid tutor user_id
- [ ] Rating divergence warning displays when threshold exceeded
- [ ] Churn risk badge shows correct color based on no-show/reschedule counts
- [ ] Performance chart handles partial data (new tutors, gaps in data)
- [ ] Session history table is sortable and filterable
- [ ] Mobile responsive design works (cards stack, table becomes cards)
- [ ] Loading states show appropriate skeletons
- [ ] Error handling for invalid IDs and service failures
- [ ] Navigation works: breadcrumbs, back buttons, session links
- [ ] TypeScript has no errors or warnings
- [ ] Accessibility: keyboard navigation, ARIA labels, color contrast

---

## Success Criteria

Phase 4.3 is complete when:
1. Tutor detail page displays all 5 sections with real data from services
2. Page follows exact specifications from project_overview.md lines 69-123
3. Display logic rules (rating divergence, churn risk) are correctly implemented
4. All UI components are reusable components from Phase 3
5. Page is fully responsive and accessible
6. Navigation integrates with dashboard and sessions pages
7. Loading and error states provide excellent UX
8. No TypeScript errors, build succeeds, all tests pass
9. Page performs well with realistic data volumes (100+ sessions)

---

## Known Dependencies

**From Phase 4.1 (Platform Metrics & Data Layer):**
- `getTutorDetailById()` - Tutor profile and calculated metrics
- `getTutorPerformanceTrends()` - 30-day trend data
- `getTutorInsights()` - Strengths and growth opportunities
- `getTutorAlerts()` - Active alerts for tutor
- `getCoachingNotes()` - Intervention log
- `getSessionsByTutorId()` - Full session history

**From Phase 3 (Reusable Components):**
- `PageHeader` - Page title and breadcrumbs
- `ScoreBadge` - Color-coded score display
- `RiskBadge` - Churn risk indicators
- `StatGrid` - Quick stats grid layout
- `PerformanceChart` - Line chart for trends
- `TrendIndicator` - Up/down/neutral arrows
- `SectionContainer` - Section wrappers
- `AlertCard` - Alert displays
- `DataTable` - Session history table
- `FilterBar` - Table filtering
- `EmptyState` - No data states
- `LoadingCard` - Loading skeletons
- `Dialog` - Modal for add note form

**From Database Schema:**
- Users, tutors, sessions, session metrics tables
- Tutor insights table
- Alerts table
- Coaching notes table (may need migration)

---

## Next Steps After Phase 4.3

Once tutor detail page is complete, Phase 4.4 (Session Detail Page) can begin. Session cards in the session history table will link to `/sessions/[id]` for detailed session analysis.

Future enhancements (Phase 5 or later):
- Server Actions for acknowledge/resolve alerts
- Server Actions for adding coaching notes
- Rich text editor for notes
- Export session history to CSV
- Share tutor profile link with other admins
- Compare multiple tutors side-by-side
- Tutor self-service view (same page, different permissions)
