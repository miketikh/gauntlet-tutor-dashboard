# Component Library Documentation

## Overview

This directory contains comprehensive documentation for the Tutor Quality Scoring System's reusable UI component library. All components are built using **shadcn/ui** primitives, **Tailwind CSS** for styling, **Recharts** for data visualization, and **lucide-react** for icons.

The component library is organized into three main categories, each serving specific purposes in building consistent, performant interfaces across the platform.

## Component Categories

### 1. [Data Display Components](./data-display.md)

Core components for presenting metrics, scores, and data in consistent formats.

**Components:**
- **MetricCard** - Display key metrics with optional trend indicators
- **ScoreBadge** - Color-coded score badges (0-10 scale)
- **TrendIndicator** - Directional indicators for changes
- **DataTable** - Reusable table with sorting and filtering

**When to use:** Dashboards, metric displays, performance overviews, any scenario where you need to present numerical data or scores.

### 2. [Specialized Components](./specialized.md)

Domain-specific components for the tutoring platform's unique needs.

**Components:**
- **PerformanceChart** - Multi-line charts for performance trends
- **AlertCard** - System alerts and insights with severity-based styling
- **SessionCard** - Compact session summary cards
- **RiskBadge** - Churn risk level indicators

**When to use:** Performance tracking, alert systems, session histories, churn risk assessment, and other tutoring-specific features.

### 3. [Layout Components](./layout.md)

Structural components for page organization and content arrangement.

**Components:**
- **PageHeader** - Consistent page headers with breadcrumbs and actions
- **SectionContainer** - Content section wrappers with variants
- **TwoColumnLayout** - Responsive two-column layouts
- **StatGrid** - Grid layout for multiple metrics
- **EmptyState** - No-data state displays

**When to use:** Page structure, content organization, responsive layouts, and handling empty states.

## Component Library Structure

```
components/
├── ui/                          # All UI components (shadcn/ui pattern)
│   ├── button.tsx              # Base shadcn components
│   ├── card.tsx
│   ├── badge.tsx
│   ├── input.tsx
│   ├── label.tsx
│   ├── select.tsx
│   ├── textarea.tsx
│   ├── checkbox.tsx
│   ├── radio-group.tsx
│   ├── switch.tsx
│   ├── slider.tsx
│   ├── dialog.tsx
│   │
│   ├── metric-card.tsx         # Data Display Components
│   ├── score-badge.tsx
│   ├── trend-indicator.tsx
│   ├── data-table.tsx
│   │
│   ├── performance-chart.tsx   # Specialized Components
│   ├── alert-card.tsx
│   ├── session-card.tsx
│   ├── risk-badge.tsx
│   │
│   ├── page-header.tsx         # Layout Components
│   ├── section-container.tsx
│   ├── two-column-layout.tsx
│   ├── stat-grid.tsx
│   ├── empty-state.tsx
│   │
│   ├── filter-bar.tsx          # Form Components
│   ├── date-range-picker.tsx
│   ├── loading-card.tsx
│   └── toast.tsx
│
lib/
├── utils.ts                     # cn() utility for className merging
└── utils/
    └── formatting.ts            # Data formatting utilities

app/
└── components-test/             # Component testing page
    └── page.tsx
```

## Import Paths and Naming Conventions

All components use the `@/components/ui/` import path:

```tsx
import { MetricCard } from "@/components/ui/metric-card"
import { ScoreBadge } from "@/components/ui/score-badge"
import { PerformanceChart } from "@/components/ui/performance-chart"
import { PageHeader } from "@/components/ui/page-header"
```

Utilities use `@/lib/`:

```tsx
import { cn } from "@/lib/utils"
import { formatScore, formatDuration } from "@/lib/utils/formatting"
```

## Design System Integration

### Color Coding

Components follow a consistent color scheme aligned with the Tutor Quality Scoring System standards:

**Score Ranges:**
- **0-3.9**: Destructive (Red) - Poor performance, critical issues
- **4-6.9**: Warning (Yellow) - Needs improvement
- **7-8.4**: Default (Blue) - Good performance
- **8.5-10**: Success (Green) - Excellent performance

**Alert Severity:**
- **Info**: Blue - Informational messages
- **Warning**: Yellow - Requires attention
- **Critical**: Red - Urgent action needed

**Risk Levels:**
- **Low**: Green - Minimal concern
- **Medium**: Yellow - Monitor closely
- **High**: Red - Immediate action required

### Variants and Customization

Most components support variants through the `class-variance-authority` (cva) pattern:

```tsx
// Example: ScoreBadge with size variants
<ScoreBadge score={8.5} size="sm" />
<ScoreBadge score={8.5} size="md" />
<ScoreBadge score={8.5} size="lg" />

// Example: MetricCard with variant
<MetricCard
  title="Session Score"
  value="8.5"
  variant="success"
/>
```

All components accept a `className` prop for additional customization using the `cn()` utility from `@/lib/utils`.

## TypeScript Support

All components are fully typed with TypeScript interfaces. Each component exports its props interface:

```tsx
import { MetricCard, type MetricCardProps } from "@/components/ui/metric-card"
import { PerformanceChart, type PerformanceChartProps } from "@/components/ui/performance-chart"
```

## Component Composition

Components are designed to be composable and work together seamlessly:

```tsx
import { StatGrid } from "@/components/ui/stat-grid"
import { MetricCard } from "@/components/ui/metric-card"
import { TrendIndicator } from "@/components/ui/trend-indicator"

export function DashboardMetrics() {
  return (
    <StatGrid columns={4}>
      <MetricCard
        title="Avg Session Score"
        value="8.4"
        icon={TrendingUp}
        variant="success"
        trend={<TrendIndicator direction="up" value="+0.3" />}
      />
      {/* More metrics... */}
    </StatGrid>
  )
}
```

## Data Flow Principles

**Important:** Components never fetch data directly. They receive data via props:

```tsx
// ❌ DON'T: Fetch data inside component
function SessionList() {
  const [sessions, setSessions] = useState([])

  useEffect(() => {
    fetch('/api/sessions').then(/* ... */)
  }, [])

  return <DataTable data={sessions} />
}

// ✅ DO: Pass data from parent/Server Component
async function SessionsPage() {
  const sessions = await fetchSessions() // Server-side fetch

  return <SessionList sessions={sessions} />
}

function SessionList({ sessions }) {
  return <DataTable data={sessions} columns={columns} />
}
```

## Responsive Design

All layout components are mobile-first and responsive:

- **StatGrid**: Auto-adjusts column count on smaller screens
- **TwoColumnLayout**: Stacks columns on mobile by default
- **DataTable**: Horizontal scroll on small screens
- **PageHeader**: Actions stack below title on mobile

## Accessibility

Components follow accessibility best practices:

- Semantic HTML elements
- ARIA labels and roles where appropriate
- Keyboard navigation support
- Focus indicators via Tailwind's `focus-visible` utilities
- Color contrast meeting WCAG AA standards

## Testing Page

Visit `/components-test` to see all components in action with realistic data. This page is for development only and is not linked in the main navigation.

```bash
# Access the test page
http://localhost:3000/components-test
```

## Usage Guidelines

### When to Use Which Component

**Displaying a single metric:**
- Use `MetricCard` for dashboard-style metrics with trends
- Use `ScoreBadge` for inline score displays (in tables, cards, etc.)

**Showing trends:**
- Use `TrendIndicator` for simple up/down indicators
- Use `PerformanceChart` for historical trend visualization

**Listing data:**
- Use `DataTable` for tabular data with sorting/filtering needs
- Use `SessionCard` for session-specific lists
- Use `EmptyState` when lists are empty

**Page structure:**
- Use `PageHeader` at the top of every major page
- Use `SectionContainer` to organize content into sections
- Use `TwoColumnLayout` for main content + sidebar layouts
- Use `StatGrid` for metric overviews

**Alerts and warnings:**
- Use `AlertCard` for system-generated insights and alerts
- Use `RiskBadge` for churn risk indicators

### Form and Interaction Components

- Use `FilterBar` for table/list filtering interfaces
- Use `DateRangePicker` for date range selection
- Use `LoadingCard` during data fetching
- Use shadcn `Dialog` for modals and confirmations

## Next Steps

1. **Review category-specific documentation:**
   - [Data Display Components](./data-display.md)
   - [Specialized Components](./specialized.md)
   - [Layout Components](./layout.md)

2. **Explore the test page:**
   - Visit `/components-test` to see all components in action
   - Review the code in `app/components-test/page.tsx` for usage examples

3. **Start building features:**
   - Use these components in Phase 4 feature implementation
   - Refer back to this documentation for prop types and usage patterns

## Contributing

When creating new components:

1. Follow the shadcn/ui pattern (see existing components)
2. Use TypeScript interfaces for all props
3. Support `className` prop with `cn()` utility
4. Use `cva()` for variant management
5. Add to the appropriate category
6. Document in the relevant `.md` file
7. Add examples to `/components-test` page

## Support

For questions or issues with components:
- Review the detailed documentation in category-specific files
- Check the `/components-test` page for working examples
- Examine existing component source code in `components/ui/`
