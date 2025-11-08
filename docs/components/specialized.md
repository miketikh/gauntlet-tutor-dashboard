# Specialized Components

Domain-specific components for the tutoring platform.

## PerformanceChart

Multi-metric line charts for performance trends using Recharts.

### Import

```tsx
import { PerformanceChart } from "@/components/ui/performance-chart"
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| data | PerformanceChartData[] | Required | Array of data points |
| metrics | Array | ["sessionScore", "engagement", "satisfaction"] | Metrics to display |
| height | number | 300 | Chart height in pixels |
| title | string | undefined | Optional chart title |
| className | string | undefined | Additional CSS classes |

### Data Format

```tsx
interface PerformanceChartData {
  date: string
  sessionScore?: number
  engagement?: number
  satisfaction?: number
}
```

### Usage Example

```tsx
<PerformanceChart
  data={trendData}
  metrics={["sessionScore", "engagement"]}
  height={300}
  title="30-Day Performance Trends"
/>
```

---

## AlertCard

System alerts and insights with severity-based styling.

### Import

```tsx
import { AlertCard } from "@/components/ui/alert-card"
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| title | string | Required | Alert title |
| description | string | Required | Alert message |
| severity | "info" or "warning" or "critical" | Required | Alert severity level |
| timestamp | Date | Required | Alert creation time |
| onAcknowledge | function | undefined | Acknowledge callback |
| onResolve | function | undefined | Resolve callback |
| sessionId | string | undefined | Related session ID |
| className | string | undefined | Additional CSS classes |

### Severity Colors

- **info**: Blue - Informational messages
- **warning**: Yellow - Requires attention
- **critical**: Red - Urgent action needed

### Usage Example

```tsx
<AlertCard
  severity="warning"
  title="Low Engagement Detected"
  description="Student engagement score dropped below 5.0"
  timestamp={new Date()}
  sessionId="session-123"
  onResolve={() => handleResolve()}
/>
```

---

## SessionCard

Compact session summary cards for lists and feeds.

### Import

```tsx
import { SessionCard } from "@/components/ui/session-card"
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| session | SessionCardData | Required | Session data object |
| onClick | function | undefined | Click callback |
| className | string | undefined | Additional CSS classes |

### Session Data Format

```tsx
interface SessionCardData {
  id: string
  timestamp: Date
  subject: string
  tutorName: string
  overallScore?: number
  engagementScore?: number
  highlights?: string[]
  flags?: string[]
}
```

### Usage Example

```tsx
<SessionCard
  session={{
    id: "session-1",
    timestamp: new Date(),
    subject: "Algebra II",
    tutorName: "Sarah Johnson",
    overallScore: 8.5,
    engagementScore: 9.0,
    highlights: ["Strong questioning technique"],
    flags: ["First Session"]
  }}
  onClick={(id) => router.push(`/sessions/${id}`)}
/>
```

---

## RiskBadge

Churn risk level indicators.

### Import

```tsx
import { RiskBadge } from "@/components/ui/risk-badge"
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| level | "low" or "medium" or "high" | Required | Risk level |
| type | "tutor" or "student" | undefined | Risk type |
| showLabel | boolean | true | Show label text |
| customLabel | string | undefined | Custom label override |
| size | "sm" or "md" or "lg" | "md" | Badge size |
| className | string | undefined | Additional CSS classes |

### Risk Colors

- **low**: Green - Minimal concern
- **medium**: Yellow - Monitor closely
- **high**: Red - Immediate action required

### Usage Example

```tsx
<RiskBadge level="low" size="md" />
<RiskBadge level="high" type="student" showLabel={true} />
<RiskBadge level="medium" customLabel="Moderate Churn Risk" />
```

---

## Best Practices

### PerformanceChart
- Use 1-3 metrics maximum for clarity
- Provide date labels in consistent format
- Handle missing data points gracefully

### AlertCard
- Use appropriate severity levels
- Provide clear, actionable descriptions
- Include session links when relevant

### SessionCard
- Use in lists or grids
- Handle optional fields gracefully
- Provide click handlers for navigation

### RiskBadge
- Use consistent labeling across platform
- Show labels in key displays
- Consider size based on context
