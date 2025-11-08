"use client"

import * as React from "react"
import { ColumnDef } from "@tanstack/react-table"
import { DataTable } from "@/components/ui/data-table"
import { ScoreBadge } from "@/components/ui/score-badge"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, FileText, Filter, X } from "lucide-react"
import { format } from "date-fns"
import { useRouter } from "next/navigation"

interface SessionHistoryItem {
  id: string
  scheduled_start: Date
  subject_name: string
  student_id: string
  session_number: number
  overall_session_score: string | null
  status: string
  follow_up_booked: boolean
}

interface SessionHistoryTableProps {
  sessions: SessionHistoryItem[]
  tutorId: string
}

const statusColors: Record<string, string> = {
  completed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  scheduled: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  cancelled: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
  no_show_tutor: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  no_show_student: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
  rescheduled: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
}

export function SessionHistoryTable({ sessions, tutorId }: SessionHistoryTableProps) {
  const router = useRouter()
  const [subjectFilter, setSubjectFilter] = React.useState<string>("all")
  const [statusFilter, setStatusFilter] = React.useState<string>("all")
  const [dateRangeFilter, setDateRangeFilter] = React.useState<string>("all")

  // Get unique subjects
  const subjects = React.useMemo(() => {
    const uniqueSubjects = Array.from(new Set(sessions.map(s => s.subject_name)))
    return uniqueSubjects.sort()
  }, [sessions])

  // Filter sessions
  const filteredSessions = React.useMemo(() => {
    let filtered = [...sessions]

    // Subject filter
    if (subjectFilter !== "all") {
      filtered = filtered.filter(s => s.subject_name === subjectFilter)
    }

    // Status filter
    if (statusFilter !== "all") {
      if (statusFilter === "flagged") {
        filtered = filtered.filter(s => {
          const score = s.overall_session_score ? parseFloat(s.overall_session_score) : null
          return score !== null && score < 6.5
        })
      } else {
        filtered = filtered.filter(s => s.status === statusFilter)
      }
    }

    // Date range filter
    if (dateRangeFilter !== "all") {
      const now = new Date()
      const cutoffDate = new Date()

      if (dateRangeFilter === "7d") {
        cutoffDate.setDate(now.getDate() - 7)
      } else if (dateRangeFilter === "30d") {
        cutoffDate.setDate(now.getDate() - 30)
      } else if (dateRangeFilter === "90d") {
        cutoffDate.setDate(now.getDate() - 90)
      }

      if (dateRangeFilter !== "all") {
        filtered = filtered.filter(s => new Date(s.scheduled_start) >= cutoffDate)
      }
    }

    return filtered
  }, [sessions, subjectFilter, statusFilter, dateRangeFilter])

  // Define columns
  const columns: ColumnDef<SessionHistoryItem>[] = [
    {
      id: "date",
      accessorKey: "scheduled_start",
      header: "Date/Time",
      cell: ({ row }) => {
        const date = new Date(row.original.scheduled_start)
        return (
          <div className="flex flex-col">
            <span className="font-medium">{format(date, "MMM d, yyyy")}</span>
            <span className="text-xs text-muted-foreground">{format(date, "h:mm a")}</span>
          </div>
        )
      },
      enableSorting: true,
    },
    {
      id: "subject",
      accessorKey: "subject_name",
      header: "Subject",
      cell: ({ row }) => (
        <span className="font-medium">{row.original.subject_name}</span>
      ),
      enableSorting: true,
    },
    {
      id: "student",
      accessorKey: "student_id",
      header: "Student",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground font-mono">
          {row.original.student_id.slice(0, 8)}...
        </span>
      ),
    },
    {
      id: "session_number",
      accessorKey: "session_number",
      header: "Session #",
      cell: ({ row }) => (
        <span className="text-sm">{row.original.session_number}</span>
      ),
      enableSorting: true,
    },
    {
      id: "score",
      accessorKey: "overall_session_score",
      header: "Score",
      cell: ({ row }) => {
        const score = row.original.overall_session_score
        return score ? (
          <ScoreBadge score={parseFloat(score)} size="sm" />
        ) : (
          <span className="text-xs text-muted-foreground">N/A</span>
        )
      },
      enableSorting: true,
    },
    {
      id: "status",
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.status
        const colorClass = statusColors[status] || "bg-gray-100 text-gray-800"
        return (
          <Badge variant="outline" className={colorClass}>
            {status.replace(/_/g, " ")}
          </Badge>
        )
      },
    },
  ]

  const handleRowClick = (row: SessionHistoryItem) => {
    router.push(`/sessions/${row.id}`)
  }

  const hasActiveFilters = subjectFilter !== "all" || statusFilter !== "all" || dateRangeFilter !== "all"

  const resetFilters = () => {
    setSubjectFilter("all")
    setStatusFilter("all")
    setDateRangeFilter("all")
  }

  if (sessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/30 p-12 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <FileText className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="mb-2 text-lg font-semibold text-foreground">No sessions yet</h3>
        <p className="text-sm text-muted-foreground">This tutor hasn't completed any sessions yet.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-muted/30 p-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Filters:</span>
        </div>

        {/* Subject Filter */}
        <Select value={subjectFilter} onValueChange={setSubjectFilter}>
          <SelectTrigger className="w-[180px] bg-background">
            <SelectValue placeholder="All Subjects" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Subjects</SelectItem>
            {subjects.map(subject => (
              <SelectItem key={subject} value={subject}>
                {subject}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Date Range Filter */}
        <Select value={dateRangeFilter} onValueChange={setDateRangeFilter}>
          <SelectTrigger className="w-[160px] bg-background">
            <SelectValue placeholder="All Time" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Time</SelectItem>
            <SelectItem value="7d">Last 7 Days</SelectItem>
            <SelectItem value="30d">Last 30 Days</SelectItem>
            <SelectItem value="90d">Last 90 Days</SelectItem>
          </SelectContent>
        </Select>

        {/* Status Filter */}
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px] bg-background">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="completed">Completed Only</SelectItem>
            <SelectItem value="flagged">Flagged Only (&lt;6.5)</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
            <SelectItem value="no_show_tutor">Tutor No-Show</SelectItem>
          </SelectContent>
        </Select>

        {/* Reset Filters */}
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={resetFilters} className="gap-1">
            <X className="h-3 w-3" />
            Reset
          </Button>
        )}

        {/* Results Count */}
        <div className="ml-auto text-sm text-muted-foreground">
          Showing {filteredSessions.length} of {sessions.length} sessions
        </div>
      </div>

      {/* Table */}
      {filteredSessions.length > 0 ? (
        <DataTable
          columns={columns}
          data={filteredSessions}
          onRowClick={handleRowClick}
          sortable={true}
        />
      ) : (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/30 p-12 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <Calendar className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="mb-2 text-lg font-semibold text-foreground">No sessions match filters</h3>
          <p className="mb-6 text-sm text-muted-foreground">Try adjusting your filter criteria.</p>
          <Button variant="outline" onClick={resetFilters}>
            Reset Filters
          </Button>
        </div>
      )}
    </div>
  )
}
