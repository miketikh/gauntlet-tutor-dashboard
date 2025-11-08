# Layout Components

Structural components for page organization and content arrangement.

## PageHeader

Consistent page headers with breadcrumbs and action buttons.

### Import

```tsx
import { PageHeader } from "@/components/ui/page-header"
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| title | string | Required | Page title |
| description | string | undefined | Optional description |
| breadcrumbs | Breadcrumb[] | undefined | Breadcrumb navigation |
| actions | ReactNode | undefined | Action buttons or elements |
| className | string | undefined | Additional CSS classes |

### Breadcrumb Format

```tsx
interface Breadcrumb {
  label: string
  href?: string
}
```

### Usage Example

```tsx
<PageHeader
  title="Tutor Performance"
  description="View detailed performance metrics"
  breadcrumbs={[
    { label: "Dashboard", href: "/dashboard" },
    { label: "Tutors", href: "/dashboard/tutors" },
    { label: "Sarah Johnson" }
  ]}
  actions={
    <>
      <Button variant="outline">Export</Button>
      <Button>Message Tutor</Button>
    </>
  }
/>
```

---

## SectionContainer

Content section wrappers with variants for different layouts.

### Import

```tsx
import { SectionContainer } from "@/components/ui/section-container"
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| title | string | undefined | Section title |
| description | string | undefined | Section description |
| actions | ReactNode | undefined | Action buttons |
| variant | "default" or "bordered" or "card" | "default" | Visual variant |
| children | ReactNode | Required | Section content |
| className | string | undefined | Additional CSS classes |

### Variants

- **default**: Simple container, no borders
- **bordered**: Border with padding
- **card**: Full Card component treatment

### Usage Example

```tsx
<SectionContainer
  title="Recent Sessions"
  description="Sessions from the past 30 days"
  variant="bordered"
  actions={<Button>View All</Button>}
>
  <SessionList sessions={recentSessions} />
</SectionContainer>
```

---

## TwoColumnLayout

Responsive two-column layouts with flexible width ratios.

### Import

```tsx
import { TwoColumnLayout } from "@/components/ui/two-column-layout"
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| leftColumn | ReactNode | Required | Left column content |
| rightColumn | ReactNode | Required | Right column content |
| leftWidth | "1/3" or "1/2" or "2/3" | "1/2" | Left column width ratio |
| gap | "sm" or "md" or "lg" | "md" | Gap between columns |
| stackOnMobile | boolean | true | Stack columns on mobile |
| className | string | undefined | Additional CSS classes |

### Usage Example

```tsx
<TwoColumnLayout
  leftWidth="2/3"
  leftColumn={
    <SectionContainer title="Session History">
      <DataTable columns={columns} data={sessions} />
    </SectionContainer>
  }
  rightColumn={
    <SectionContainer title="Insights" variant="card">
      <AlertCard {...alertData} />
    </SectionContainer>
  }
/>
```

---

## StatGrid

Responsive grid for displaying multiple metrics.

### Import

```tsx
import { StatGrid } from "@/components/ui/stat-grid"
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| stats | StatItem[] | Required | Array of stat items |
| columns | 2 or 3 or 4 | 3 | Number of columns |
| variant | "default" or "compact" | "default" | Visual variant |
| className | string | undefined | Additional CSS classes |

### Stat Item Format

```tsx
interface StatItem {
  label: string
  value: string | number
  icon?: LucideIcon
  trend?: "up" | "down" | "neutral"
  trendValue?: string | number
  description?: string
  variant?: "default" | "success" | "warning" | "danger"
}
```

### Usage Example

```tsx
<StatGrid
  columns={4}
  stats={[
    {
      label: "Active Tutors",
      value: 42,
      icon: Users,
      trend: "up",
      trendValue: "+3",
      variant: "success"
    },
    {
      label: "Total Students",
      value: 1289,
      icon: BookOpen,
      trend: "up",
      trendValue: "+47"
    }
  ]}
/>
```

---

## EmptyState

No-data state displays with optional actions.

### Import

```tsx
import { EmptyState } from "@/components/ui/empty-state"
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| icon | LucideIcon | Required | Icon to display |
| title | string | Required | Empty state title |
| description | string | Required | Descriptive message |
| action | EmptyStateAction | undefined | Optional action button |
| className | string | undefined | Additional CSS classes |

### Action Format

```tsx
interface EmptyStateAction {
  label: string
  onClick: () => void
  variant?: "default" | "outline" | "ghost"
}
```

### Usage Example

```tsx
import { FileText } from "lucide-react"

<EmptyState
  icon={FileText}
  title="No sessions found"
  description="There are no sessions matching your criteria. Try adjusting your filters."
  action={{
    label: "Clear Filters",
    onClick: () => resetFilters(),
    variant: "outline"
  }}
/>
```

---

## Form Components

### FilterBar

Flexible filtering interface for tables and lists.

### Import

```tsx
import { FilterBar } from "@/components/ui/filter-bar"
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| filters | FilterConfig[] | Required | Filter configurations |
| onFilterChange | function | Required | Filter change handler |
| onReset | function | Required | Reset handler |
| className | string | undefined | Additional CSS classes |

### Usage Example

```tsx
<FilterBar
  filters={[
    {
      type: "select",
      id: "subject",
      label: "Subject",
      options: [
        { value: "math", label: "Mathematics" },
        { value: "science", label: "Science" }
      ]
    },
    {
      type: "search",
      id: "search",
      label: "Search",
      placeholder: "Search tutors..."
    }
  ]}
  onFilterChange={(id, value) => handleFilterChange(id, value)}
  onReset={() => resetFilters()}
/>
```

---

### DateRangePicker

Date range selection with preset options.

### Import

```tsx
import { DateRangePicker } from "@/components/ui/date-range-picker"
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| value | DateRange | Required | Current date range |
| onChange | function | Required | Change handler |
| presets | Array | ["7d", "30d", "90d", "all"] | Preset options |
| className | string | undefined | Additional CSS classes |

### Usage Example

```tsx
<DateRangePicker
  value={{ from: startDate, to: endDate }}
  onChange={(range) => setDateRange(range)}
  presets={["7d", "30d", "90d", "all"]}
/>
```

---

### LoadingCard

Skeleton loading states for different component types.

### Import

```tsx
import { LoadingCard } from "@/components/ui/loading-card"
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| variant | "metric" or "chart" or "table" or "list" | Required | Loading type |
| count | number | 3 | Number of items (for table/list) |
| className | string | undefined | Additional CSS classes |

### Usage Example

```tsx
{isLoading ? (
  <LoadingCard variant="table" count={5} />
) : (
  <DataTable data={data} columns={columns} />
)}
```

---

## Best Practices

### PageHeader
- Use on all major pages
- Provide breadcrumbs for navigation context
- Place primary actions in actions prop

### SectionContainer
- Use to organize page content into logical sections
- Choose appropriate variant based on visual hierarchy
- Use bordered or card for emphasis

### TwoColumnLayout
- Use 2/3-1/3 for main content + sidebar patterns
- Ensure content stacks well on mobile
- Consider gap size for visual balance

### StatGrid
- Use 2-4 columns depending on viewport
- Limit to most important metrics
- Use consistent icons across stats

### EmptyState
- Always provide helpful description
- Offer clear action to resolve empty state
- Use appropriate icon for context
