"use client"

import * as React from "react"
import {
  Users, TrendingUp, Calendar, Clock, AlertCircle,
  FileText, CheckCircle, Star, BookOpen, BarChart3
} from "lucide-react"
import { ColumnDef } from "@tanstack/react-table"

// Data Display Components
import { MetricCard } from "@/components/ui/metric-card"
import { ScoreBadge } from "@/components/ui/score-badge"
import { TrendIndicator } from "@/components/ui/trend-indicator"
import { DataTable } from "@/components/ui/data-table"

// Specialized Components
import { PerformanceChart, PerformanceChartData } from "@/components/ui/performance-chart"
import { AlertCard } from "@/components/ui/alert-card"
import { SessionCard, SessionCardData } from "@/components/ui/session-card"
import { RiskBadge } from "@/components/ui/risk-badge"

// Layout Components
import { PageHeader } from "@/components/ui/page-header"
import { SectionContainer } from "@/components/ui/section-container"
import { TwoColumnLayout } from "@/components/ui/two-column-layout"
import { StatGrid } from "@/components/ui/stat-grid"
import { EmptyState } from "@/components/ui/empty-state"

// Form Components
import { FilterBar, FilterConfig } from "@/components/ui/filter-bar"
import { DateRangePicker, DateRange } from "@/components/ui/date-range-picker"
import { LoadingCard } from "@/components/ui/loading-card"

// Utilities
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

// Mock Data Generators
function generateMockPerformanceData(): PerformanceChartData[] {
  const data: PerformanceChartData[] = []
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - 30)

  for (let i = 0; i < 30; i++) {
    const date = new Date(startDate)
    date.setDate(date.getDate() + i)

    // Use deterministic values based on index to prevent hydration errors
    const variance = ((i * 7) % 10) / 10 // Creates variation 0-0.9
    data.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      sessionScore: 6 + variance * 3, // 6-9 range
      engagement: 5.5 + ((variance + 0.2) % 1) * 3.5, // 5.5-9 range
      satisfaction: 7 + ((variance + 0.4) % 1) * 2, // 7-9 range
    })
  }

  return data
}

function generateMockSessions(): SessionCardData[] {
  const subjects = ["Algebra", "Calculus", "Physics", "Chemistry", "Biology"]
  const tutors = ["Sarah Johnson", "Mike Chen", "Emily Davis", "James Wilson"]
  const sessions: SessionCardData[] = []

  for (let i = 0; i < 5; i++) {
    const date = new Date()
    date.setHours(date.getHours() - (i * 3 + i)) // Deterministic time offset

    // Use deterministic values based on index to prevent hydration errors
    sessions.push({
      id: `session-${i}`,
      timestamp: date,
      subject: subjects[i % subjects.length], // Cycle through subjects deterministically
      tutorName: tutors[i % tutors.length], // Cycle through tutors deterministically
      overallScore: 5 + (((i * 3) % 10) / 2.5), // 5-9 range
      engagementScore: 6 + (((i * 4) % 10) / 3.3), // 6-9 range
      highlights: [
        "Student showed strong understanding of core concepts",
        "Completed all practice problems successfully",
      ],
      flags: i === 0 ? ["First Session"] : i === 2 ? ["Technical Issues"] : [],
    })
  }

  return sessions
}

interface MockTableData {
  id: string
  tutor: string
  sessions: number
  avgScore: number
  status: string
}

function generateMockTableData(): MockTableData[] {
  return [
    { id: "1", tutor: "Sarah Johnson", sessions: 156, avgScore: 8.7, status: "Active" },
    { id: "2", tutor: "Mike Chen", sessions: 203, avgScore: 8.9, status: "Active" },
    { id: "3", tutor: "Emily Davis", sessions: 87, avgScore: 7.8, status: "Active" },
    { id: "4", tutor: "James Wilson", sessions: 134, avgScore: 8.2, status: "Away" },
    { id: "5", tutor: "Lisa Anderson", sessions: 45, avgScore: 6.9, status: "Active" },
  ]
}

export default function ComponentsTestPage() {
  const [dateRange, setDateRange] = React.useState<DateRange>({
    from: new Date(new Date().setDate(new Date().getDate() - 30)),
    to: new Date(),
  })

  const [filters, setFilters] = React.useState<FilterConfig[]>([
    {
      type: "select",
      id: "subject",
      label: "Subject",
      placeholder: "All Subjects",
      options: [
        { value: "math", label: "Mathematics" },
        { value: "science", label: "Science" },
        { value: "english", label: "English" },
      ],
      value: "",
    },
    {
      type: "search",
      id: "search",
      label: "Search",
      placeholder: "Search tutors...",
      value: "",
    },
  ])

  const handleFilterChange = (filterId: string, value: any) => {
    setFilters((prev) =>
      prev.map((filter) =>
        filter.id === filterId ? { ...filter, value } : filter
      )
    )
  }

  const handleFilterReset = () => {
    setFilters((prev) =>
      prev.map((filter): FilterConfig => {
        if (filter.type === "checkbox") {
          return { ...filter, value: [] as string[] }
        } else if (filter.type === "dateRange") {
          return { ...filter, value: { from: new Date(), to: new Date() } }
        }
        return { ...filter, value: "" }
      })
    )
  }

  const tableColumns: ColumnDef<MockTableData>[] = [
    {
      accessorKey: "tutor",
      header: "Tutor",
    },
    {
      accessorKey: "sessions",
      header: "Sessions",
    },
    {
      accessorKey: "avgScore",
      header: "Avg Score",
      cell: ({ row }) => <ScoreBadge score={row.original.avgScore} size="sm" />,
    },
    {
      accessorKey: "status",
      header: "Status",
    },
  ]

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Page Header */}
        <PageHeader
          title="Component Library Test Page"
          description="A comprehensive showcase of all reusable UI components"
          breadcrumbs={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Components Test" },
          ]}
          actions={
            <>
              <Button variant="outline">Secondary Action</Button>
              <Button>Primary Action</Button>
            </>
          }
        />

        {/* Data Display Components */}
        <SectionContainer
          title="Data Display Components"
          description="Components for displaying metrics, scores, and trends"
          variant="bordered"
        >
          {/* MetricCard Examples */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Metric Cards
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard
                title="Total Sessions"
                value="1,247"
                icon={Calendar}
                trend="up"
                trendValue="+12%"
                description="vs last month"
              />
              <MetricCard
                title="Average Score"
                value="8.4"
                icon={Star}
                trend="up"
                trendValue="+0.3"
                description="All tutors"
                variant="success"
              />
              <MetricCard
                title="At-Risk Students"
                value="23"
                icon={AlertCircle}
                trend="down"
                trendValue="-5"
                description="Need attention"
                variant="warning"
              />
              <MetricCard
                title="Critical Alerts"
                value="3"
                icon={AlertCircle}
                trend="neutral"
                description="Requires action"
                variant="danger"
              />
            </div>
          </div>

          {/* ScoreBadge Examples */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Score Badges
            </h4>
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex flex-col gap-2">
                <span className="text-xs text-muted-foreground">Small</span>
                <div className="flex gap-2">
                  <ScoreBadge score={2.5} size="sm" />
                  <ScoreBadge score={5.0} size="sm" />
                  <ScoreBadge score={7.8} size="sm" />
                  <ScoreBadge score={9.2} size="sm" />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-xs text-muted-foreground">Medium</span>
                <div className="flex gap-2">
                  <ScoreBadge score={2.5} size="md" />
                  <ScoreBadge score={5.0} size="md" />
                  <ScoreBadge score={7.8} size="md" />
                  <ScoreBadge score={9.2} size="md" />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-xs text-muted-foreground">Large</span>
                <div className="flex gap-2">
                  <ScoreBadge score={2.5} size="lg" />
                  <ScoreBadge score={5.0} size="lg" />
                  <ScoreBadge score={7.8} size="lg" />
                  <ScoreBadge score={9.2} size="lg" />
                </div>
              </div>
            </div>
          </div>

          {/* TrendIndicator Examples */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Trend Indicators
            </h4>
            <div className="flex flex-wrap gap-6">
              <TrendIndicator direction="up" value="+12%" size="md" />
              <TrendIndicator direction="down" value="-5%" size="md" />
              <TrendIndicator direction="neutral" value="0%" size="md" />
              <TrendIndicator direction="up" size="sm" />
              <TrendIndicator direction="down" size="sm" />
            </div>
          </div>

          {/* DataTable Example */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Data Table
            </h4>
            <DataTable
              columns={tableColumns}
              data={generateMockTableData()}
              sortable={true}
              onRowClick={(row) => console.log("Clicked row:", row)}
            />
          </div>
        </SectionContainer>

        {/* Specialized Components */}
        <SectionContainer
          title="Specialized Components"
          description="Domain-specific components for charts, alerts, and sessions"
          variant="bordered"
        >
          {/* PerformanceChart Example */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Performance Chart
            </h4>
            <Card>
              <CardContent className="pt-6">
                <PerformanceChart
                  data={generateMockPerformanceData()}
                  metrics={["sessionScore", "engagement", "satisfaction"]}
                  height={300}
                  title="30-Day Performance Trends"
                />
              </CardContent>
            </Card>
          </div>

          {/* AlertCard Examples */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Alert Cards
            </h4>
            <div className="space-y-3">
              <AlertCard
                severity="info"
                title="New Feature Available"
                description="You can now export session reports to PDF format."
                timestamp={new Date(Date.now() - 3600000)}
                onAcknowledge={() => console.log("Info acknowledged")}
              />
              <AlertCard
                severity="warning"
                title="Low Engagement Detected"
                description="Student engagement score dropped below 5.0 in recent sessions."
                timestamp={new Date(Date.now() - 7200000)}
                sessionId="session-123"
                onAcknowledge={() => console.log("Warning acknowledged")}
                onResolve={() => console.log("Warning resolved")}
              />
              <AlertCard
                severity="critical"
                title="Critical Issue: Session Quality"
                description="Multiple consecutive sessions scored below 4.0. Immediate intervention required."
                timestamp={new Date(Date.now() - 1800000)}
                sessionId="session-456"
                onResolve={() => console.log("Critical resolved")}
              />
            </div>
          </div>

          {/* SessionCard Examples */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Session Cards
            </h4>
            <div className="space-y-3">
              {generateMockSessions().map((session) => (
                <SessionCard
                  key={session.id}
                  session={session}
                  onClick={(id) => console.log("Clicked session:", id)}
                />
              ))}
            </div>
          </div>

          {/* RiskBadge Examples */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Risk Badges
            </h4>
            <div className="flex flex-wrap gap-4">
              <div className="flex flex-col gap-2">
                <span className="text-xs text-muted-foreground">Small</span>
                <div className="flex gap-2">
                  <RiskBadge level="low" size="sm" />
                  <RiskBadge level="medium" size="sm" />
                  <RiskBadge level="high" size="sm" />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-xs text-muted-foreground">Medium</span>
                <div className="flex gap-2">
                  <RiskBadge level="low" size="md" />
                  <RiskBadge level="medium" size="md" />
                  <RiskBadge level="high" size="md" />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-xs text-muted-foreground">Large</span>
                <div className="flex gap-2">
                  <RiskBadge level="low" size="lg" />
                  <RiskBadge level="medium" size="lg" />
                  <RiskBadge level="high" size="lg" />
                </div>
              </div>
            </div>
          </div>
        </SectionContainer>

        {/* Layout Components */}
        <SectionContainer
          title="Layout Components"
          description="Structural components for organizing content"
          variant="bordered"
        >
          {/* StatGrid Example */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Stat Grid
            </h4>
            <StatGrid
              columns={4}
              stats={[
                {
                  label: "Active Tutors",
                  value: 42,
                  icon: Users,
                  trend: "up",
                  trendValue: "+3",
                  variant: "success",
                },
                {
                  label: "Total Students",
                  value: 1289,
                  icon: BookOpen,
                  trend: "up",
                  trendValue: "+47",
                },
                {
                  label: "Avg Session Duration",
                  value: "45m",
                  icon: Clock,
                  trend: "neutral",
                },
                {
                  label: "Platform Score",
                  value: 8.4,
                  icon: BarChart3,
                  trend: "up",
                  trendValue: "+0.2",
                  variant: "success",
                },
              ]}
            />
          </div>

          {/* TwoColumnLayout Example */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Two Column Layout
            </h4>
            <TwoColumnLayout
              leftWidth="2/3"
              leftColumn={
                <Card>
                  <CardHeader>
                    <CardTitle>Main Content</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      This is the main content area (2/3 width on desktop).
                      It contains primary information and stacks on top on mobile.
                    </p>
                  </CardContent>
                </Card>
              }
              rightColumn={
                <Card>
                  <CardHeader>
                    <CardTitle>Sidebar</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      This is the sidebar area (1/3 width on desktop).
                      Perfect for insights and metadata.
                    </p>
                  </CardContent>
                </Card>
              }
            />
          </div>

          {/* EmptyState Example */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Empty State
            </h4>
            <EmptyState
              icon={FileText}
              title="No sessions found"
              description="There are no sessions matching your criteria. Try adjusting your filters or date range."
              action={{
                label: "Clear Filters",
                onClick: () => console.log("Filters cleared"),
                variant: "outline",
              }}
            />
          </div>

          {/* SectionContainer Variants */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Section Container Variants
            </h4>
            <div className="space-y-6">
              <SectionContainer variant="default" title="Default Variant">
                <p className="text-sm text-muted-foreground">
                  Simple container with optional title. No borders or background.
                </p>
              </SectionContainer>

              <SectionContainer variant="bordered" title="Bordered Variant">
                <p className="text-sm text-muted-foreground">
                  Container with border and padding. Good for grouping related content.
                </p>
              </SectionContainer>

              <SectionContainer variant="card" title="Card Variant" description="Uses Card component">
                <p className="text-sm text-muted-foreground">
                  Full card treatment with header. Best for prominent sections.
                </p>
              </SectionContainer>
            </div>
          </div>
        </SectionContainer>

        {/* Form Components */}
        <SectionContainer
          title="Form Components & Utilities"
          description="Interactive components for filtering and date selection"
          variant="bordered"
        >
          {/* FilterBar Example */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Filter Bar
            </h4>
            <FilterBar
              filters={filters}
              onFilterChange={handleFilterChange}
              onReset={handleFilterReset}
            />
          </div>

          {/* DateRangePicker Example */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Date Range Picker
            </h4>
            <DateRangePicker
              value={dateRange}
              onChange={setDateRange}
              presets={["7d", "30d", "90d", "all"]}
            />
          </div>

          {/* LoadingCard Examples */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Loading Cards
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <span className="text-xs text-muted-foreground">Metric Loading</span>
                <LoadingCard variant="metric" />
              </div>
              <div className="space-y-2">
                <span className="text-xs text-muted-foreground">Chart Loading</span>
                <LoadingCard variant="chart" />
              </div>
            </div>
            <div className="space-y-2">
              <span className="text-xs text-muted-foreground">Table Loading</span>
              <LoadingCard variant="table" count={5} />
            </div>
            <div className="space-y-2">
              <span className="text-xs text-muted-foreground">List Loading</span>
              <LoadingCard variant="list" count={3} />
            </div>
          </div>
        </SectionContainer>

        {/* Footer Note */}
        <Card className="border-dashed">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground text-center">
              This page is for development testing only. It demonstrates all reusable components
              with realistic data and interactive examples. Not linked in main navigation.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
