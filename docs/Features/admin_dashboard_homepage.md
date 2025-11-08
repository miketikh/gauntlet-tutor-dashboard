# Phase 4.2: Admin Dashboard Homepage - Implementation Tasks

## Context

The Admin Dashboard Homepage is the central command center for the Tutor Quality Scoring System, providing platform administrators with a comprehensive, at-a-glance view of system health and performance. This dashboard aggregates critical metrics, highlights top performers and struggling tutors, and displays recent session activity with powerful filtering capabilities.

The dashboard serves as the primary landing page after authentication and acts as the navigation hub for accessing detailed views of individual tutors, students, and sessions. It's designed to surface actionable insights quickly, enabling administrators to identify trends, catch problems early, and make data-driven decisions about coaching interventions.

This phase builds upon the foundation established in earlier phases:
- **Phase 1**: Database schema and seed data (✅ Complete)
- **Phase 2**: Supabase authentication and basic layout (✅ Complete)
- **Phase 3**: Reusable component library (components from `reusable_component_tasks.md`)
- **Phase 4.1**: Platform metrics and data layer services (prerequisite for this phase)

The dashboard follows the exact specifications from `docs/project_overview.md` (lines 33-68), which defines three main sections:

1. **Platform Health Metrics Bar**: 4 key metrics (Avg Session Score, First Session Convert Rate, Tutor Churn Risk Count, No-Show Rate) with trend indicators comparing to the previous period
2. **Tutor Scoreboard**: Two-column layout with Top 10 Performers (left) and 5 Tutors Needing Attention (right)
3. **Recent Sessions Feed**: Last 20 sessions in reverse chronological order with filters (All / Flagged Only / High Scoring Only)

We're using **Next.js 15 App Router** with Server Components for initial data fetching, then client-side navigation with **TanStack Query** for caching. The service layer (`services/`) handles all business logic and data aggregation, following the pattern: Server Components → Service Layer → Drizzle/Supabase → Database.

## Instructions for AI Agent

This is Phase 4.2 of the Tutor Quality Scoring System implementation. Follow this workflow:

1. **Read Phase**: Read all files referenced in each PR's task list before starting implementation
2. **Implement**: Complete tasks in order, checking off each with [x] as you finish
3. **Test**: Follow the "What to Test" section for each PR - build project and verify component behavior
4. **Document**: After completing PR tasks, provide a summary of what was implemented
5. **Wait**: After each PR summary, wait for explicit approval before starting the next PR

**Important Architectural Patterns**:
- Server Components fetch data directly from services (no API routes needed)
- Services live in `services/` directory and return TypeScript objects
- Components accept data via props (no data fetching in components themselves)
- Use TanStack Query for client-side caching and refetching
- Use Zustand for UI state (filters, modals)
- All database queries through Drizzle ORM in service layer
- Follow existing patterns in `app/dashboard/page.tsx` for layout structure

**Critical**: Phase 4.1 (Platform Metrics & Data Layer) must be complete before starting this phase. Reference the service functions created in Phase 4.1 for data fetching.

---

## Phase 4.2: Admin Dashboard Homepage

**Estimated Time:** 3-4 days

This phase implements the complete admin dashboard homepage with all three main sections: platform metrics, tutor scoreboard, and recent sessions feed.

### PR 4.2.1: Service Layer - Dashboard Data Functions

**Goal:** Create service layer functions to fetch and calculate all dashboard data

**Tasks:**
- [ ] Read `lib/db/schema/sessions.ts` to understand session schema
- [ ] Read `lib/db/schema/tutors.ts` to understand tutor schema
- [ ] Read `lib/db/schema/users.ts` to understand user schema
- [ ] Read `lib/db/types.ts` to understand all enums and types
- [ ] Read `lib/db/index.ts` to understand Drizzle database connection
- [ ] Read `lib/supabase/server.ts` to understand Supabase server client usage
- [ ] Create NEW: `services/dashboard.ts` with:
  - `getPlatformMetrics()` function returning object with:
    - `avgSessionScore` (current period average from sessions table)
    - `avgSessionScoreTrend` (comparison to previous period, return "up" | "down" | "neutral")
    - `firstSessionConvertRate` (% of first sessions leading to session 2)
    - `firstSessionConvertRateTrend` (comparison to previous period)
    - `tutorChurnRiskCount` (count of tutors with high churn risk based on no-shows/reschedules)
    - `noShowRate` (% of sessions with no-shows)
    - `noShowRateTrend` (comparison to previous period)
  - `getTopPerformers(limit: number)` function returning array of tutors with:
    - `user_id`, `name`, `overall_score` (calculated from recent sessions), `session_count`
    - Ordered by overall_score DESC
  - `getTutorsNeedingAttention(limit: number)` function returning array of tutors with:
    - `user_id`, `name`, `overall_score`, `active_alert_count` (from alerts table)
    - Filter: tutors with active unacknowledged alerts or overall_score < 6.5
    - Ordered by alert severity and score (critical alerts first, then lowest scores)
  - `getRecentSessions(limit: number)` function returning array of sessions with:
    - `id`, `scheduled_start`, `subject_name`, `tutor_name`, `overall_session_score`
    - `student_engagement_score` (from session_audio_metrics)
    - `student_satisfaction_rating` (from session_feedback, nullable)
    - `is_flagged` (boolean: true if score < 6.0 or has critical alerts)
    - Join with users table for tutor name, subjects table for subject name
    - Ordered by scheduled_start DESC
- [ ] Add TypeScript interfaces for return types:
  - `PlatformMetrics` interface
  - `TopPerformer` interface
  - `TutorNeedingAttention` interface
  - `RecentSession` interface
- [ ] Implement helper function `calculateTrend(current: number, previous: number)` returning "up" | "down" | "neutral"
- [ ] Add error handling and logging for all service functions
- [ ] Export all functions and types from `services/dashboard.ts`

**What to Test:**
1. Build project - verify no TypeScript errors in service layer
2. Create test script to call `getPlatformMetrics()` - verify it returns correct structure
3. Test `getTopPerformers(10)` - verify it returns sorted tutors with correct data
4. Test `getTutorsNeedingAttention(5)` - verify filtering and sorting logic
5. Test `getRecentSessions(20)` - verify joins work and data is complete
6. Test trend calculation with various values - verify correct direction returned

**Files Changed:**
- NEW: `services/dashboard.ts` - Dashboard data fetching service layer
- `services/index.ts` - Export dashboard service functions (create if doesn't exist)

**Notes:**
- Use Drizzle ORM query builder for all database queries
- Follow the pattern: query data → calculate aggregates → return typed objects
- "Previous period" means same duration as current period (e.g., if current is 30 days, previous is prior 30 days)
- Overall score calculation: weighted average of last 30 days of sessions (or use tutor_performance_snapshots if available)
- Tutor churn risk calculation: tutors with >= 2 no-shows OR >= 5 reschedules in last 30 days
- Handle null/missing data gracefully (e.g., sessions without feedback)

---

### PR 4.2.2: Platform Health Metrics Component

**Goal:** Build the platform health metrics bar at the top of the dashboard

**Tasks:**
- [ ] Read `components/ui/metric-card.tsx` from Phase 3 to understand MetricCard API
- [ ] Read `components/ui/trend-indicator.tsx` from Phase 3 to understand TrendIndicator API
- [ ] Read `components/ui/stat-grid.tsx` from Phase 3 to understand StatGrid API
- [ ] Read `services/dashboard.ts` to understand PlatformMetrics type
- [ ] Read `app/dashboard/page.tsx` to understand current dashboard structure
- [ ] Create NEW: `app/dashboard/_components/platform-metrics-bar.tsx` with:
  - `PlatformMetricsBar` Server Component
  - Fetches data using `getPlatformMetrics()` from service layer
  - Displays 4 metrics in a StatGrid (4 columns on desktop, 2 on tablet, 1 on mobile)
  - Each metric uses MetricCard component with:
    - **Avg Session Score**: BarChart3 icon, score formatted to 1 decimal, trend indicator
    - **First Session Convert Rate**: UserCheck icon, percentage formatted, trend indicator
    - **Tutor Churn Risk Count**: AlertTriangle icon, count as integer, variant based on count (warning if > 5, critical if > 10)
    - **No-Show Rate**: Clock icon, percentage formatted, trend indicator
  - Use lucide-react icons as specified
  - Color variants based on metric health (green for good trends, red for bad trends)
- [ ] Add loading state component `platform-metrics-skeleton.tsx`:
  - Skeleton version of PlatformMetricsBar using LoadingCard component
  - Matches the layout of actual metrics bar
- [ ] Update `app/dashboard/page.tsx`:
  - Remove existing placeholder stats grid
  - Import and render `<PlatformMetricsBar />` inside `<Suspense>` with skeleton fallback
  - Keep existing header and navigation structure
- [ ] Create utility function in `lib/utils/formatting.ts`:
  - `formatScore(score: number)` - returns "X.X" format
  - `formatPercentage(decimal: number)` - returns "XX.X%" format
  - Export these utilities for reuse

**What to Test:**
1. Build project - verify no TypeScript or import errors
2. Visit `/dashboard` - verify metrics bar renders at the top
3. Check responsive behavior - verify 4 columns on desktop, 2 on tablet, 1 on mobile
4. Verify trend indicators show correct icons (up/down/neutral) and colors
5. Test with mock data showing different trends - verify color coding is correct
6. Test loading state by simulating slow network - verify skeleton appears

**Files Changed:**
- NEW: `app/dashboard/_components/platform-metrics-bar.tsx` - Platform metrics display
- NEW: `app/dashboard/_components/platform-metrics-skeleton.tsx` - Loading state
- `app/dashboard/page.tsx` - Integrate platform metrics bar
- `lib/utils/formatting.ts` - Add formatting utilities (create if doesn't exist)

**Notes:**
- Use `_components` directory convention for page-specific components
- Server Component pattern: fetch data, pass to client components as props if needed
- MetricCard should handle optional trend prop gracefully
- Trend colors: up = green for positive metrics (score, convert rate), red for negative metrics (churn risk, no-show rate)
- Format all decimals consistently (1 decimal for scores, 1 decimal for percentages)

---

### PR 4.2.3: Tutor Scoreboard - Two Column Layout

**Goal:** Implement the tutor scoreboard with top performers and needs attention lists

**Tasks:**
- [ ] Read `components/ui/two-column-layout.tsx` from Phase 3 to understand layout API
- [ ] Read `components/ui/score-badge.tsx` from Phase 3 to understand ScoreBadge API
- [ ] Read `components/ui/badge.tsx` to understand Badge component
- [ ] Read `services/dashboard.ts` to understand TopPerformer and TutorNeedingAttention types
- [ ] Create NEW: `app/dashboard/_components/top-performers-list.tsx` with:
  - `TopPerformersList` Server Component
  - Fetches top 10 performers using `getTopPerformers(10)` from service layer
  - Displays ordered list with rank numbers (1-10)
  - Each entry shows:
    - Rank badge (gold for #1, silver for #2, bronze for #3, default for rest)
    - Tutor name (linked to `/tutors/[id]` - use Link component)
    - Overall score displayed with ScoreBadge component
    - Session count in muted text (e.g., "24 sessions")
  - Clean, compact list design with hover states
  - Empty state if no data (use EmptyState component)
- [ ] Create NEW: `app/dashboard/_components/tutors-needing-attention.tsx` with:
  - `TutorsNeedingAttention` Server Component
  - Fetches 5 tutors using `getTutorsNeedingAttention(5)` from service layer
  - Displays list with alert indicators
  - Each entry shows:
    - Tutor name (linked to `/tutors/[id]`)
    - Overall score with ScoreBadge (will show warning/critical colors)
    - Active alert count badge (red badge with count if > 0)
    - Severity indicator (AlertCircle icon in red for critical alerts)
  - Urgent visual styling (border accent for critical items)
  - Empty state with success message if no tutors need attention
- [ ] Create NEW: `app/dashboard/_components/tutor-scoreboard.tsx` with:
  - `TutorScoreboard` component that combines both lists
  - Uses TwoColumnLayout with 2/3 left (top performers), 1/3 right (needs attention)
  - Section headers: "Top Performers 🌟" and "Needs Attention ⚠️"
  - Uses SectionContainer for each column
  - Responsive: stacks on mobile
- [ ] Update `app/dashboard/page.tsx`:
  - Add `<TutorScoreboard />` below PlatformMetricsBar
  - Wrap in Suspense with appropriate skeleton

**What to Test:**
1. Build project - verify no errors
2. Visit `/dashboard` - verify scoreboard appears with two columns
3. Test responsive layout - verify columns stack on mobile
4. Click tutor names - verify navigation to `/tutors/[id]` (even if page doesn't exist yet)
5. Verify rank badges show correct colors (#1 gold, #2 silver, #3 bronze)
6. Verify alert count badges appear for tutors with active alerts
7. Test with empty data - verify empty states render correctly

**Files Changed:**
- NEW: `app/dashboard/_components/top-performers-list.tsx` - Top 10 performers list
- NEW: `app/dashboard/_components/tutors-needing-attention.tsx` - Tutors with alerts/low scores
- NEW: `app/dashboard/_components/tutor-scoreboard.tsx` - Combined scoreboard component
- `app/dashboard/page.tsx` - Integrate tutor scoreboard

**Notes:**
- Rank badge colors: use Badge component with custom color variants (gold: bg-yellow-500, silver: bg-gray-400, bronze: bg-amber-700)
- Link to tutor detail pages even though they don't exist yet (Phase 4.3 will build them)
- "Needs Attention" should visually stand out - use border-l-4 with destructive color for critical items
- Empty state for "Needs Attention" is a positive message (e.g., "All tutors performing well!")
- Session count should be muted/secondary text to keep focus on names and scores

---

### PR 4.2.4: Recent Sessions Feed - Base Implementation

**Goal:** Create the recent sessions feed with session cards and basic filtering

**Tasks:**
- [ ] Read `components/ui/session-card.tsx` from Phase 3 to understand SessionCard API
- [ ] Read `components/ui/filter-bar.tsx` from Phase 3 to understand FilterBar API (if built)
- [ ] Read `components/ui/badge.tsx` to understand Badge variants
- [ ] Read `services/dashboard.ts` to understand RecentSession type
- [ ] Create NEW: `app/dashboard/_components/session-feed-filters.tsx` with:
  - `SessionFeedFilters` Client Component (mark with "use client")
  - Three filter buttons: "All", "Flagged Only", "High Scoring Only"
  - Uses Zustand for filter state management
  - Active filter highlighted with primary background
  - Horizontal layout, responsive
- [ ] Create NEW: `lib/stores/dashboard-store.ts` with:
  - Zustand store for dashboard UI state
  - State: `sessionFilter: "all" | "flagged" | "high_scoring"`
  - Action: `setSessionFilter(filter: string)`
  - Simple, focused store for this feature
- [ ] Create NEW: `app/dashboard/_components/recent-sessions-feed.tsx` with:
  - `RecentSessionsFeed` Server Component for initial data
  - Fetches 20 recent sessions using `getRecentSessions(20)` from service layer
  - Passes data to client component for filtering
- [ ] Create NEW: `app/dashboard/_components/session-feed-list.tsx` with:
  - `SessionFeedList` Client Component (mark with "use client")
  - Receives all sessions as props
  - Reads filter state from Zustand store
  - Filters sessions based on active filter:
    - "all": show all sessions
    - "flagged": only sessions where `is_flagged === true`
    - "high_scoring": only sessions where `overall_session_score >= 8.5`
  - Maps filtered sessions to SessionCard components
  - Each SessionCard shows:
    - Time ago (e.g., "2 hours ago") using date-fns formatDistanceToNow
    - Subject name and tutor name
    - Overall score badge (using ScoreBadge)
    - Engagement score (smaller display)
    - Student satisfaction rating (if available, show stars or N/A)
    - Flags: "First Session", "Technical Issues", etc. as small badges
  - Click handler navigates to `/sessions/[id]`
  - Empty state if no sessions match filter
- [ ] Update `app/dashboard/page.tsx`:
  - Add `<RecentSessionsFeed />` below TutorScoreboard
  - Wrap in Suspense with skeleton
  - Use SectionContainer with title "Recent Sessions"

**What to Test:**
1. Build project - verify no errors
2. Visit `/dashboard` - verify session feed appears with all 20 sessions
3. Click "Flagged Only" filter - verify only flagged sessions show
4. Click "High Scoring Only" - verify only sessions with score >= 8.5 show
5. Click "All" - verify all sessions reappear
6. Verify time ago displays correctly (use mock data with various timestamps)
7. Click session card - verify navigation to `/sessions/[id]`
8. Test empty states for each filter

**Files Changed:**
- NEW: `app/dashboard/_components/session-feed-filters.tsx` - Filter buttons
- NEW: `app/dashboard/_components/recent-sessions-feed.tsx` - Server component wrapper
- NEW: `app/dashboard/_components/session-feed-list.tsx` - Client component with filtering
- NEW: `lib/stores/dashboard-store.ts` - Zustand store for UI state
- `app/dashboard/page.tsx` - Integrate session feed

**Notes:**
- Use "use client" directive for components that use Zustand or interactive state
- Server Component (RecentSessionsFeed) fetches data, Client Component (SessionFeedList) handles filtering
- This is the React Server Components pattern: server for data, client for interactivity
- date-fns should already be installed (check package.json)
- SessionCard should handle missing student_satisfaction_rating gracefully (show "N/A" or hide rating)
- Flag badges: first session (blue), technical issues (yellow), low score (red)

---

### PR 4.2.5: Navigation & Layout Finalization

**Goal:** Add global navigation header and finalize dashboard layout structure

**Tasks:**
- [ ] Read `app/dashboard/page.tsx` to understand current header implementation
- [ ] Read `components/ui/page-header.tsx` from Phase 3 to understand PageHeader API
- [ ] Create NEW: `app/dashboard/_components/dashboard-nav.tsx` with:
  - `DashboardNav` component for top navigation
  - Logo and app name on left
  - Nav links: Dashboard | Tutors | Students | Sessions | Settings
  - Current page highlighted (use `usePathname()` from next/navigation)
  - User email and sign out button on right
  - Responsive: hamburger menu on mobile
  - Matches existing header styling from current dashboard page
- [ ] Create NEW: `app/dashboard/layout.tsx` with:
  - Layout wrapper for all `/dashboard/*` pages
  - Includes `<DashboardNav />` at top
  - Main content area with max-width container and padding
  - Consistent background color
  - Auth check: redirect to sign-in if not authenticated
- [ ] Update `app/dashboard/page.tsx`:
  - Remove duplicate header code (now in layout)
  - Focus on dashboard-specific content only
  - Use PageHeader component for "Dashboard" title and description
  - Clean up imports and simplify structure
- [ ] Create placeholder pages (basic shells) to enable navigation:
  - NEW: `app/dashboard/tutors/page.tsx` - "Tutors page coming soon"
  - NEW: `app/dashboard/students/page.tsx` - "Students page coming soon"
  - NEW: `app/dashboard/sessions/page.tsx` - "Sessions page coming soon"
  - NEW: `app/dashboard/settings/page.tsx` - "Settings page coming soon"
  - Each uses PageHeader and Card with "Coming Soon" message
- [ ] Add active link styling in DashboardNav:
  - Use next/link with `className` based on `pathname`
  - Active link: primary color, bold text
  - Inactive: muted text, hover effect

**What to Test:**
1. Build project - verify no errors
2. Visit `/dashboard` - verify new navigation header appears
3. Click each nav link - verify navigation works and active state highlights correctly
4. Test responsive behavior - verify hamburger menu on mobile (if implemented)
5. Visit each placeholder page - verify "coming soon" content renders
6. Test sign out - verify redirects to home page
7. Verify navigation persists across all dashboard pages

**Files Changed:**
- NEW: `app/dashboard/_components/dashboard-nav.tsx` - Global dashboard navigation
- NEW: `app/dashboard/layout.tsx` - Dashboard layout wrapper with auth check
- NEW: `app/dashboard/tutors/page.tsx` - Placeholder for Phase 4.3
- NEW: `app/dashboard/students/page.tsx` - Placeholder for Phase 4.5
- NEW: `app/dashboard/sessions/page.tsx` - Placeholder for Phase 4.4
- NEW: `app/dashboard/settings/page.tsx` - Placeholder for Phase 4.6
- `app/dashboard/page.tsx` - Simplified to use layout, removed duplicate header

**Notes:**
- Layout pattern: `layout.tsx` provides shared UI, `page.tsx` provides page-specific content
- Auth check in layout ensures all dashboard pages are protected
- Navigation links point to routes that will be built in later phases
- Mobile navigation can be simple (stacked vertical menu) or hamburger - choose based on complexity
- Active link detection: `pathname === '/dashboard/tutors'` for exact match
- Keep dashboard layout consistent with existing design system (same colors, spacing, typography)

---

### PR 4.2.6: Polish, Error Handling & Documentation

**Goal:** Add error boundaries, loading states, and comprehensive documentation

**Tasks:**
- [ ] Read all dashboard components created in PRs 4.2.1-4.2.5
- [ ] Create NEW: `app/dashboard/error.tsx` with:
  - Error boundary for dashboard route segment
  - User-friendly error message with retry button
  - Logs error details for debugging
  - Styled consistently with dashboard theme
- [ ] Create NEW: `app/dashboard/loading.tsx` with:
  - Dashboard-wide loading state
  - Shows skeleton versions of all major sections (metrics bar, scoreboard, feed)
  - Uses LoadingCard components from Phase 3
- [ ] Update service layer functions in `services/dashboard.ts`:
  - Add try-catch blocks for all database queries
  - Add meaningful error messages
  - Add optional caching layer (comment for future implementation with Redis)
  - Add JSDoc comments for all exported functions
- [ ] Create NEW: `lib/utils/error-handling.ts` with:
  - `handleServiceError(error: unknown, context: string)` utility
  - Logs errors with context information
  - Returns user-friendly error messages
  - Type-safe error handling
- [ ] Add data validation to service functions:
  - Validate limit parameters (must be > 0)
  - Handle empty result sets gracefully
  - Return empty arrays instead of throwing for "no data" scenarios
- [ ] Create NEW: `docs/dashboard-implementation.md` with:
  - Overview of dashboard architecture
  - Data flow diagram (text-based): Server Component → Service → Drizzle → DB
  - Component hierarchy and responsibilities
  - Filtering logic explanation
  - Metric calculation formulas
  - Troubleshooting guide for common issues
- [ ] Update `docs/general_project_plan.md`:
  - Mark Phase 4.2 as complete
  - Add summary of what was built
  - Update success criteria checklist

**What to Test:**
1. Build project - verify no TypeScript errors
2. Simulate database error (disconnect DB temporarily) - verify error boundary catches and displays
3. Test loading states by throttling network - verify skeletons appear appropriately
4. Test with empty database - verify empty states render instead of errors
5. Test with invalid data (e.g., null values) - verify service layer handles gracefully
6. Review JSDoc comments - verify they're complete and accurate
7. Review documentation - verify it's comprehensive and matches implementation

**Files Changed:**
- NEW: `app/dashboard/error.tsx` - Error boundary for dashboard
- NEW: `app/dashboard/loading.tsx` - Dashboard loading state
- `services/dashboard.ts` - Add error handling, validation, and JSDoc comments
- NEW: `lib/utils/error-handling.ts` - Centralized error handling utilities
- NEW: `docs/dashboard-implementation.md` - Dashboard architecture documentation
- `docs/general_project_plan.md` - Update phase completion status

**Notes:**
- Error boundaries in Next.js 15 App Router use `error.tsx` convention
- Loading states use `loading.tsx` convention (automatic Suspense boundary)
- Service layer errors should be caught and logged, not thrown to UI (unless critical)
- Empty states are not errors - handle gracefully with helpful messaging
- Documentation should be detailed enough for handoff to other developers
- JSDoc comments should include parameter types, return types, and examples
- Consider rate limiting and caching strategies (document for future implementation)

---

## Deliverable Checklist

After completing all PRs, verify:
- [ ] Platform metrics bar displays 4 key metrics with accurate calculations
- [ ] Trend indicators show correct direction and colors
- [ ] Top performers list shows 10 tutors ranked by score
- [ ] Needs attention list shows tutors with alerts or low scores
- [ ] Recent sessions feed shows 20 sessions with accurate data
- [ ] Session filtering works correctly (All, Flagged, High Scoring)
- [ ] All navigation links work and highlight active page
- [ ] Responsive design works on mobile, tablet, and desktop
- [ ] Loading states display while data is fetching
- [ ] Error boundaries catch and display errors gracefully
- [ ] Empty states show when no data matches filters
- [ ] All links to tutor/session detail pages are functional (even if target pages don't exist yet)
- [ ] TypeScript provides full type safety throughout
- [ ] Service layer has comprehensive error handling
- [ ] Documentation is complete and accurate
- [ ] No console errors or warnings in browser
- [ ] Dashboard loads within 2 seconds with realistic data volume

---

## Success Criteria

Phase 4.2 is complete when:
1. Admin can log in and see fully functional dashboard homepage
2. Platform metrics accurately reflect database state with trend comparisons
3. Tutor scoreboard correctly identifies top performers and struggling tutors
4. Recent sessions feed displays all sessions with working filters
5. Navigation works seamlessly across all dashboard pages
6. Loading and error states handle all edge cases gracefully
7. Responsive design works on all device sizes
8. All calculations match specifications in project_overview.md
9. Performance is acceptable with 200+ sessions in database
10. Code is well-documented with JSDoc comments and architecture docs
11. All TypeScript types are correct and no `any` types used
12. Service layer is testable and follows single responsibility principle

---

## Architecture Notes

**Data Flow Pattern**:
```
Server Component (page.tsx)
  ↓ calls
Service Function (services/dashboard.ts)
  ↓ queries
Drizzle ORM (lib/db/index.ts)
  ↓ executes
PostgreSQL Database (via Supabase)
  ↓ returns
Raw Data → Service Transforms → Typed Objects → Component Props → UI
```

**Server vs Client Components**:
- **Server**: Data fetching, initial render (platform-metrics-bar, top-performers-list, tutors-needing-attention, recent-sessions-feed)
- **Client**: Interactive filtering, Zustand state (session-feed-filters, session-feed-list)
- **Hybrid**: Server fetches, passes to client for interactivity (recent-sessions-feed → session-feed-list)

**Performance Considerations**:
- Use database indexes on frequently queried columns (tutor_id, scheduled_start, status)
- Consider materialized views for complex aggregations in future
- Implement caching layer (Redis) for platform metrics (5-minute TTL)
- Batch queries where possible to reduce round trips
- Use Suspense boundaries to stream sections independently

**Future Enhancements** (not in MVP scope):
- Real-time updates using Supabase Realtime subscriptions
- Date range filtering for metrics and session feed
- Export dashboard data to CSV
- Customizable metric thresholds for alerts
- Dashboard widgets drag-and-drop rearrangement
- Scheduled email reports of dashboard data

---

## Testing Strategy

**Unit Tests** (future consideration):
- Service layer functions with mock database responses
- Trend calculation logic with various inputs
- Filtering logic for session feed
- Formatting utilities with edge cases

**Integration Tests** (future consideration):
- Full dashboard render with real database
- Navigation flow across all pages
- Filter state persistence
- Error recovery scenarios

**Manual Testing Checklist**:
1. ✅ Dashboard loads with all sections visible
2. ✅ Metrics show accurate calculations
3. ✅ Trends reflect actual data changes
4. ✅ Scoreboard ranks tutors correctly
5. ✅ Alert counts are accurate
6. ✅ Session feed shows recent sessions
7. ✅ Filters work without page reload
8. ✅ Navigation highlights active page
9. ✅ Responsive on mobile/tablet/desktop
10. ✅ Loading states appear appropriately
11. ✅ Error states handle failures gracefully
12. ✅ Empty states show when no data

---

## Next Phase Preview

**Phase 4.3: Tutor Detail Page** will build on this foundation by:
- Creating individual tutor profile pages accessible from dashboard links
- Displaying comprehensive tutor analytics and performance trends
- Showing session history from tutor perspective
- Implementing actionable insights panel with strengths and growth areas
- Adding coaching notes functionality

The dashboard homepage built in Phase 4.2 serves as the navigation hub to access all tutor detail pages.
