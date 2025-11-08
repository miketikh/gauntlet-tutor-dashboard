"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export type LoadingCardVariant = "metric" | "chart" | "table" | "list"

export interface LoadingCardProps {
  variant: LoadingCardVariant
  count?: number
  className?: string
}

export function LoadingCard({
  variant,
  count = 3,
  className,
}: LoadingCardProps) {
  if (variant === "metric") {
    return (
      <Card className={cn("", className)}>
        <CardHeader className="pb-3">
          <div className="h-4 w-24 bg-muted animate-pulse rounded" />
        </CardHeader>
        <CardContent>
          <div className="h-8 w-16 bg-muted animate-pulse rounded mb-2" />
          <div className="h-3 w-32 bg-muted animate-pulse rounded" />
        </CardContent>
      </Card>
    )
  }

  if (variant === "chart") {
    return (
      <Card className={cn("", className)}>
        <CardHeader>
          <div className="h-5 w-40 bg-muted animate-pulse rounded" />
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full bg-muted animate-pulse rounded" />
        </CardContent>
      </Card>
    )
  }

  if (variant === "table") {
    return (
      <Card className={cn("", className)}>
        <CardHeader>
          <div className="h-5 w-48 bg-muted animate-pulse rounded" />
        </CardHeader>
        <CardContent>
          {/* Table Header */}
          <div className="flex gap-4 mb-4 pb-3 border-b">
            <div className="h-4 w-24 bg-muted animate-pulse rounded" />
            <div className="h-4 w-32 bg-muted animate-pulse rounded" />
            <div className="h-4 w-20 bg-muted animate-pulse rounded" />
            <div className="h-4 w-28 bg-muted animate-pulse rounded" />
          </div>
          {/* Table Rows */}
          {Array.from({ length: count }).map((_, index) => (
            <div key={index} className="flex gap-4 mb-3">
              <div className="h-4 w-24 bg-muted animate-pulse rounded" />
              <div className="h-4 w-32 bg-muted animate-pulse rounded" />
              <div className="h-4 w-20 bg-muted animate-pulse rounded" />
              <div className="h-4 w-28 bg-muted animate-pulse rounded" />
            </div>
          ))}
        </CardContent>
      </Card>
    )
  }

  if (variant === "list") {
    return (
      <div className={cn("space-y-3", className)}>
        {Array.from({ length: count }).map((_, index) => (
          <Card key={index}>
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 bg-muted animate-pulse rounded-md" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-3/4 bg-muted animate-pulse rounded" />
                  <div className="h-3 w-1/2 bg-muted animate-pulse rounded" />
                </div>
                <div className="h-6 w-16 bg-muted animate-pulse rounded-full" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return null
}
