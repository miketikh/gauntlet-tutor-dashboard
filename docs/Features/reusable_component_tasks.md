# Phase 3: Reusable Components & UI Framework - Implementation Tasks

## Context

The Tutor Quality Scoring System requires a comprehensive library of reusable UI components to build consistent, performant interfaces across all admin views. Phase 3 focuses on creating foundational components that will be used throughout the platform - from the admin dashboard to tutor detail pages, session analysis, and student churn tracking.

This phase builds upon Phase 2's authentication and basic layout work. We're using **shadcn/ui** as our component foundation (a copy-paste approach with no runtime overhead), **Tailwind CSS** for styling, **Recharts** for data visualization, and **lucide-react** for icons. All components follow the established patterns in the codebase: using the `cn()` utility for className merging, `class-variance-authority` for variant management, and TypeScript for full type safety.

The component library is organized into three categories:
1. **Data Display Components** - Present metrics, scores, and data in consistent formats
2. **Specialized Components** - Domain-specific components for charts, alerts, and session cards
3. **Layout Components** - Structural components for page organization and modals

Each component is designed to be flexible, accessible, and composable, following the patterns established by existing shadcn/ui components in `components/ui/`. Components will be built with real data types from our database schema in mind, but will accept props rather than fetch data directly (data fetching happens in Server Components or services).

## Instructions for AI Agent

This is Phase 3 of the Tutor Quality Scoring System implementation. Follow this workflow:

1. **Read Phase**: Read all files referenced in each PR's task list before starting implementation
2. **Implement**: Complete tasks in order, checking off each with [x] as you finish
3. **Test**: Follow the "What to Test" section for each PR - build project and verify component behavior
4. **Document**: After completing PR tasks, provide a summary of what was implemented
5. **Wait**: After each PR summary, wait for explicit approval before starting the next PR

**Important**:
- All components go in `components/ui/` following existing patterns
- Use TypeScript interfaces for all props
- Follow shadcn/ui patterns (see existing Button, Card, Badge components)
- Use `cn()` utility from `@/lib/utils` for className merging
- Use `cva()` from `class-variance-authority` for variant management
- Import icons from `lucide-react`
- Never fetch data in components - accept data via props

---

## Phase 3: Reusable Components & UI Framework

**Estimated Time:** 2-3 days

This phase creates all reusable UI components needed for Phase 4 feature implementation.

### PR 3.1: Data Display Components - Core Metrics

**Goal:** Build foundational components for displaying scores, metrics, and data tables

**Tasks:**
- [x] Read `components/ui/card.tsx` to understand existing Card component patterns
- [x] Read `components/ui/badge.tsx` to understand variant and styling patterns
- [x] Read `lib/db/types.ts` to understand data types and enums
- [x] Create NEW: `components/ui/metric-card.tsx` with:
  - MetricCard component for displaying key metrics with optional trend indicators
  - Props: title, value, icon (lucide-react), trend (optional: "up" | "down" | "neutral"), trendValue (optional), description (optional), variant (optional: "default" | "success" | "warning" | "danger")
  - Use Card as base, integrate Badge for trend display
  - Support custom icon rendering with color based on variant
  - Visual hierarchy: large value, small title/description
- [x] Create NEW: `components/ui/score-badge.tsx` with:
  - ScoreBadge component for displaying numeric scores (0-10 scale)
  - Props: score (number), size ("sm" | "md" | "lg"), showLabel (boolean)
  - Color coding: 0-3.9 (destructive), 4-6.9 (warning/yellow), 7-8.4 (default), 8.5-10 (success/green)
  - Variants for different sizes with appropriate text sizing
- [x] Create NEW: `components/ui/trend-indicator.tsx` with:
  - TrendIndicator component for showing directional changes
  - Props: direction ("up" | "down" | "neutral"), value (string or number), size ("sm" | "md")
  - Icons: TrendingUp (up, green), TrendingDown (down, red), Minus (neutral, muted)
  - Option to show just icon or icon + value
- [x] Create NEW: `components/ui/data-table.tsx` with:
  - DataTable component using @tanstack/react-table
  - Props: columns (ColumnDef[]), data (T[]), onRowClick (optional), sortable (boolean), filterable (boolean)
  - Basic table styling with shadcn/ui patterns (border, rounded, alternating rows)
  - Built-in sort indicators for sortable columns
  - Responsive design with horizontal scroll on mobile
  - Empty state display

**What to Test:**
1. Build project - verify no TypeScript errors
2. Create test page rendering MetricCard with different variants and trends - verify colors and layouts
3. Test ScoreBadge with scores: 2.5, 5.0, 7.8, 9.2 - verify color coding is correct
4. Test TrendIndicator with all direction values - verify icons and colors
5. Test DataTable with mock data - verify sorting and styling

**Files Changed:**
- NEW: `components/ui/metric-card.tsx` - Metric display with trend support
- NEW: `components/ui/score-badge.tsx` - Color-coded score badges
- NEW: `components/ui/trend-indicator.tsx` - Directional indicators
- NEW: `components/ui/data-table.tsx` - Reusable table component with @tanstack/react-table

**Notes:**
- MetricCard should support lucide-react icons passed as props
- ScoreBadge color thresholds align with project_overview.md quality standards
- DataTable is foundation for session history, tutor lists, etc.
- All components should have proper TypeScript interfaces exported

---

### PR 3.2: Specialized Components - Charts & Visualizations

**Goal:** Create domain-specific components for data visualization and insights

**Tasks:**
- [x] Read `package.json` to confirm recharts is installed
- [x] Read `lib/db/schema/sessions.ts` and `lib/db/schema/tutors.ts` for data structures
- [x] Create NEW: `components/ui/performance-chart.tsx` with:
  - PerformanceChart component using Recharts LineChart
  - Props: data (Array<{date: string, sessionScore?: number, engagement?: number, satisfaction?: number}>), metrics (array of which metrics to show), height (optional), title (optional)
  - Multi-line chart supporting 1-3 metrics simultaneously
  - Legend showing metric names and colors
  - Responsive design with ResponsiveContainer
  - Tooltip showing date and all visible metric values
  - Color scheme: sessionScore (primary), engagement (accent), satisfaction (success)
  - Grid lines and axis labels
- [x] Create NEW: `components/ui/alert-card.tsx` with:
  - AlertCard component for displaying system alerts and insights
  - Props: title, description, severity ("info" | "warning" | "critical"), timestamp (Date), onAcknowledge (optional callback), onResolve (optional callback), sessionId (optional)
  - Icon based on severity: Info, AlertTriangle, AlertCircle
  - Color coding by severity using shadcn/ui color system
  - Action buttons if callbacks provided
  - Link to session detail if sessionId provided
- [x] Create NEW: `components/ui/session-card.tsx` with:
  - SessionCard component for session list displays
  - Props: session (object with id, timestamp, subject, tutor name, overall score, engagement score, highlights, flags)
  - Compact card layout with key metrics prominently displayed
  - Badge for overall score using ScoreBadge
  - Optional flag indicators (array of strings like "First Session", "Technical Issues")
  - Click handler for navigation to session detail
  - Relative time display using date-fns
- [x] Create NEW: `components/ui/risk-badge.tsx` with:
  - RiskBadge component for churn risk display
  - Props: level ("low" | "medium" | "high"), type ("tutor" | "student"), showLabel (boolean), size ("sm" | "md" | "lg")
  - Color coding: low (success/green), medium (warning/yellow), high (destructive/red)
  - Icon indicators: CheckCircle (low), AlertTriangle (medium), AlertCircle (high)
  - Label text: "Low Risk", "Medium Risk", "High Risk" or custom label

**What to Test:**
1. Build project - verify recharts integration works
2. Test PerformanceChart with mock trend data (30 days) - verify lines render, colors are distinct, tooltip works
3. Test AlertCard with all severity levels - verify colors and icons are correct
4. Test SessionCard with complete and minimal data - verify layout handles optional fields
5. Test RiskBadge with all risk levels - verify colors match design system

**Files Changed:**
- NEW: `components/ui/performance-chart.tsx` - Line chart for performance trends
- NEW: `components/ui/alert-card.tsx` - Alert/insight display component
- NEW: `components/ui/session-card.tsx` - Session summary cards
- NEW: `components/ui/risk-badge.tsx` - Risk level indicators

**Notes:**
- PerformanceChart should handle missing data points gracefully (gaps in data)
- SessionCard will be heavily used in dashboard and tutor detail pages
- AlertCard aligns with alerts table schema in database
- Use date-fns for relative time formatting (e.g., "2 hours ago")

---

### PR 3.3: Layout Components - Structure & Navigation

**Goal:** Build structural components for page layouts, headers, and modals

**Tasks:**
- [x] Read `app/dashboard/page.tsx` to understand current header pattern
- [x] Read `app/page.tsx` to see navigation patterns
- [x] Install missing shadcn/ui components if needed (dialog, separator)
- [x] Create NEW: `components/ui/page-header.tsx` with:
  - PageHeader component for consistent page titles and actions
  - Props: title, description (optional), breadcrumbs (optional array), actions (optional ReactNode for buttons)
  - Responsive layout: title/description on left, actions on right
  - Support for breadcrumb navigation using Separator component
  - Consistent spacing and typography
- [x] Create NEW: `components/ui/section-container.tsx` with:
  - SectionContainer component for content sections
  - Props: title (optional), description (optional), children, actions (optional), variant ("default" | "bordered" | "card")
  - Default: simple container with optional title
  - Bordered: with border and padding
  - Card: uses Card component with header
  - Consistent spacing between sections
- [x] Create NEW: `components/ui/two-column-layout.tsx` with:
  - TwoColumnLayout component for side-by-side content
  - Props: leftColumn (ReactNode), rightColumn (ReactNode), leftWidth ("1/3" | "1/2" | "2/3"), gap ("sm" | "md" | "lg"), stackOnMobile (boolean)
  - Responsive: stacks on mobile by default unless stackOnMobile is false
  - Flexible width ratios for different use cases
- [x] Create NEW: `components/ui/stat-grid.tsx` with:
  - StatGrid component for displaying multiple metrics in a grid
  - Props: stats (array of {label, value, icon, trend}), columns (2 | 3 | 4), variant ("default" | "compact")
  - Wraps MetricCard components in a responsive grid
  - Auto-adjusts columns on smaller screens
- [x] Add Dialog component from shadcn/ui if not present:
  - Run: `npx shadcn-ui@latest add dialog`
  - This provides Modal/Dialog functionality used across the app
- [x] Create NEW: `components/ui/empty-state.tsx` with:
  - EmptyState component for "no data" scenarios
  - Props: icon (lucide icon), title, description, action (optional button props)
  - Centered layout with icon, text, and optional CTA
  - Used in tables, lists, and pages when no data exists

**What to Test:**
1. Build project - verify all imports resolve
2. Test PageHeader with and without breadcrumbs/actions - verify responsive layout
3. Test SectionContainer with all variants - verify styling differences
4. Test TwoColumnLayout with different width ratios on desktop and mobile
5. Test StatGrid with 2, 3, and 4 columns - verify responsive behavior
6. Test EmptyState in a page context - verify centered layout

**Files Changed:**
- NEW: `components/ui/page-header.tsx` - Page header with breadcrumbs and actions
- NEW: `components/ui/section-container.tsx` - Content section wrapper
- NEW: `components/ui/two-column-layout.tsx` - Responsive two-column layout
- NEW: `components/ui/stat-grid.tsx` - Grid layout for metrics
- NEW: `components/ui/empty-state.tsx` - No data state display
- `components/ui/dialog.tsx` - Dialog/modal component (if added via shadcn)

**Notes:**
- PageHeader will be used on all major pages (Dashboard, Tutor Detail, Session Detail, etc.)
- TwoColumnLayout is crucial for Tutor Detail Page (main content + insights panel)
- Dialog component is from shadcn/ui - may need to run CLI command to add it
- EmptyState provides consistent UX when tables/lists are empty

---

### PR 3.4: Form Components & Utilities

**Goal:** Build form-related components and utility components for interactive features

**Tasks:**
- [x] Check if shadcn/ui form components are installed (select, textarea, checkbox, radio-group)
- [x] Read `components/ui/input.tsx` and `components/ui/label.tsx` for existing patterns
- [x] Add missing shadcn/ui form components:
  - Run: `npx shadcn-ui@latest add select textarea checkbox radio-group switch slider`
  - These provide consistent form controls for filters and settings
- [x] Create NEW: `components/ui/filter-bar.tsx` with:
  - FilterBar component for table/list filtering
  - Props: filters (array of filter configs), onFilterChange (callback), onReset (callback)
  - Support filter types: select dropdown, date range, search input, checkbox group
  - Horizontal layout with spacing between filters
  - "Reset Filters" button when any filters are active
  - Uses shadcn Select, Input components
- [x] Create NEW: `components/ui/date-range-picker.tsx` with:
  - DateRangePicker component for selecting date ranges
  - Props: value ({from: Date, to: Date}), onChange (callback), presets (optional: "7d", "30d", "90d", "all")
  - Uses date-fns for date manipulation
  - Preset buttons for common ranges
  - Custom date selection with two date inputs
- [x] Create NEW: `components/ui/loading-card.tsx` with:
  - LoadingCard component for skeleton loading states
  - Props: variant ("metric" | "chart" | "table" | "list"), count (number for list/table rows)
  - Skeleton animations matching the component type
  - Uses Tailwind animate-pulse for shimmer effect
- [x] Create NEW: `components/ui/toast.tsx` (if not present) with:
  - Toast notification component using sonner
  - Verify sonner is configured in app layout
  - Create helper functions: showToast, showErrorToast, showSuccessToast
- [x] Create NEW: `lib/utils/formatting.ts` with:
  - Utility functions for common formatting tasks
  - Functions: formatScore (number to X.X format), formatPercentage, formatDuration (minutes to "Xh Ym"), formatRelativeTime (using date-fns)
  - Used across all components for consistent data display

**What to Test:**
1. Build project - verify shadcn components installed correctly
2. Test FilterBar with mock filter configs (select, search, checkbox) - verify all types render
3. Test DateRangePicker with preset buttons - verify date selection and onChange callbacks
4. Test LoadingCard variants - verify skeleton animations match expected component shapes
5. Test toast helper functions - verify toasts appear and dismiss correctly
6. Test formatting utilities with various inputs - verify consistent output

**Files Changed:**
- `components/ui/select.tsx` - Select dropdown (added via shadcn CLI)
- `components/ui/textarea.tsx` - Textarea input (added via shadcn CLI)
- `components/ui/checkbox.tsx` - Checkbox input (added via shadcn CLI)
- `components/ui/radio-group.tsx` - Radio button group (added via shadcn CLI)
- `components/ui/switch.tsx` - Toggle switch (added via shadcn CLI)
- `components/ui/slider.tsx` - Range slider (added via shadcn CLI)
- NEW: `components/ui/filter-bar.tsx` - Table/list filtering component
- NEW: `components/ui/date-range-picker.tsx` - Date range selection
- NEW: `components/ui/loading-card.tsx` - Skeleton loading states
- NEW: `components/ui/toast.tsx` - Toast notification setup (if needed)
- NEW: `lib/utils/formatting.ts` - Data formatting utilities

**Notes:**
- Shadcn components are added via CLI, not npm - they copy code into your project
- FilterBar is essential for session history tables and tutor lists
- DateRangePicker will be used in dashboard and performance trend views
- LoadingCard provides better UX than spinners during data fetching
- Formatting utilities ensure consistent data presentation across the app

---

### PR 3.5: Component Documentation & Testing Page

**Goal:** Create comprehensive documentation and a testing page for all components

**Tasks:**
- [x] Read all component files created in PRs 3.1-3.4
- [x] Create NEW: `app/components-test/page.tsx` with:
  - Test page showcasing all components with examples
  - Sections for each component category (Data Display, Specialized, Layout, Forms)
  - Multiple variants and states demonstrated for each component
  - Not linked in navigation (direct URL access only)
  - Includes mock data generators for realistic testing
- [x] Create NEW: `docs/components/README.md` with:
  - Overview of component library structure
  - List of all components with brief descriptions
  - Guidelines for using components (when to use which component)
  - Import paths and naming conventions
  - Notes on theming and customization
- [x] Create NEW: `docs/components/data-display.md` with:
  - Detailed documentation for MetricCard, ScoreBadge, TrendIndicator, DataTable
  - Props tables with types and descriptions
  - Usage examples with code snippets
  - Visual examples or descriptions of each variant
- [x] Create NEW: `docs/components/specialized.md` with:
  - Detailed documentation for PerformanceChart, AlertCard, SessionCard, RiskBadge
  - Props tables with types and descriptions
  - Usage examples with code snippets
  - Notes on data format requirements (especially for charts)
- [x] Create NEW: `docs/components/layout.md` with:
  - Detailed documentation for PageHeader, SectionContainer, TwoColumnLayout, StatGrid, EmptyState
  - Props tables with types and descriptions
  - Usage examples with code snippets
  - Responsive behavior notes
- [x] Update `docs/general_project_plan.md`:
  - Mark Phase 3 as complete
  - Add summary of components created
  - Update "Next Steps" section

**What to Test:**
1. Build project - verify all imports and types are correct
2. Visit `/components-test` page - verify all components render without errors
3. Test interactive components (filters, dialogs, etc.) on test page
4. Review documentation for completeness and accuracy
5. Verify all code examples in docs are copy-paste ready

**Files Changed:**
- NEW: `app/components-test/page.tsx` - Component showcase and testing page
- NEW: `docs/components/README.md` - Component library overview
- NEW: `docs/components/data-display.md` - Data display component docs
- NEW: `docs/components/specialized.md` - Specialized component docs
- NEW: `docs/components/layout.md` - Layout component docs
- `docs/general_project_plan.md` - Updated status for Phase 3

**Notes:**
- Test page is for development only - won't be in production navigation
- Documentation should be detailed enough for developers (or AI) to use components correctly
- Include TypeScript type definitions in documentation
- Code examples should show realistic use cases from our domain (tutoring platform)

---

## Deliverable Checklist

After completing all PRs, verify:
- [ ] All components have proper TypeScript interfaces
- [ ] All components follow shadcn/ui patterns (cn utility, variants, etc.)
- [ ] Components are responsive and work on mobile
- [ ] Color coding aligns with design system (destructive, success, warning, muted)
- [ ] No direct data fetching in components (props-based only)
- [ ] Loading states exist for async scenarios
- [ ] Empty states exist for no-data scenarios
- [ ] All components tested in `app/components-test/page.tsx`
- [ ] Documentation is complete with usage examples
- [ ] Phase 3 marked complete in general_project_plan.md

---

## Success Criteria

Phase 3 is complete when:
1. All 20+ reusable components are implemented and tested
2. Components follow established patterns and use shadcn/ui primitives
3. TypeScript provides full type safety for all props
4. Test page demonstrates all components with realistic data
5. Documentation enables independent component usage
6. No build errors or TypeScript warnings
7. Components are ready for use in Phase 4 feature implementation

---

## Next Phase Preview

**Phase 4: Feature Implementation** will use these components to build:
- Admin Dashboard with platform metrics and session feed
- Tutor Detail Page with performance charts and insights
- Session Detail Page with comprehensive analytics
- Student Detail Page with churn risk assessment
- Algorithm Refinement Dashboard with weight adjustments

All Phase 4 features will compose these reusable components rather than building custom UI from scratch.
