"use client"

import * as React from "react"
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table"
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"

import { cn } from "@/lib/utils"

export interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  onRowClick?: (row: TData) => void
  sortable?: boolean
  filterable?: boolean
  className?: string
}

export function DataTable<TData, TValue>({
  columns,
  data,
  onRowClick,
  sortable = true,
  className,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([])

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: sortable ? getSortedRowModel() : undefined,
    onSortingChange: sortable ? setSorting : undefined,
    state: {
      sorting: sortable ? sorting : undefined,
    },
  })

  return (
    <div className={cn("w-full overflow-auto rounded-lg border", className)}>
      <table className="w-full caption-bottom text-sm">
        <thead className="border-b bg-muted/50">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                return (
                  <th
                    key={header.id}
                    className="h-12 px-4 text-left align-middle font-medium text-muted-foreground"
                  >
                    {header.isPlaceholder ? null : (
                      <div
                        className={cn(
                          "flex items-center gap-2",
                          header.column.getCanSort() && sortable
                            ? "cursor-pointer select-none hover:text-foreground"
                            : ""
                        )}
                        onClick={
                          header.column.getCanSort() && sortable
                            ? header.column.getToggleSortingHandler()
                            : undefined
                        }
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                        {header.column.getCanSort() && sortable && (
                          <span className="ml-auto">
                            {header.column.getIsSorted() === "asc" ? (
                              <ArrowUp className="size-4" />
                            ) : header.column.getIsSorted() === "desc" ? (
                              <ArrowDown className="size-4" />
                            ) : (
                              <ArrowUpDown className="size-4 opacity-50" />
                            )}
                          </span>
                        )}
                      </div>
                    )}
                  </th>
                )
              })}
            </tr>
          ))}
        </thead>
        <tbody className="[&_tr:last-child]:border-0">
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                data-state={row.getIsSelected() && "selected"}
                className={cn(
                  "border-b transition-colors",
                  onRowClick
                    ? "cursor-pointer hover:bg-muted/50"
                    : "hover:bg-muted/30"
                )}
                onClick={() => onRowClick?.(row.original)}
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="p-4 align-middle">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td
                colSpan={columns.length}
                className="h-24 text-center text-muted-foreground"
              >
                No results.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

export interface SortableColumnHeaderProps {
  children: React.ReactNode
  className?: string
}

export function SortableColumnHeader({
  children,
  className,
}: SortableColumnHeaderProps) {
  return <div className={cn("flex items-center gap-2", className)}>{children}</div>
}
