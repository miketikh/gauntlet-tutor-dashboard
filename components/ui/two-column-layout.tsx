import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const twoColumnLayoutVariants = cva("grid gap-6", {
  variants: {
    leftWidth: {
      "1/3": "md:grid-cols-[1fr_2fr]",
      "1/2": "md:grid-cols-2",
      "2/3": "md:grid-cols-[2fr_1fr]",
    },
    gap: {
      sm: "gap-4",
      md: "gap-6",
      lg: "gap-8",
    },
    stackOnMobile: {
      true: "grid-cols-1",
      false: "grid-cols-2",
    },
  },
  defaultVariants: {
    leftWidth: "1/2",
    gap: "md",
    stackOnMobile: true,
  },
})

export interface TwoColumnLayoutProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof twoColumnLayoutVariants> {
  leftColumn: React.ReactNode
  rightColumn: React.ReactNode
}

export function TwoColumnLayout({
  leftColumn,
  rightColumn,
  leftWidth = "1/2",
  gap = "md",
  stackOnMobile = true,
  className,
  ...props
}: TwoColumnLayoutProps) {
  return (
    <div
      className={cn(
        twoColumnLayoutVariants({ leftWidth, gap, stackOnMobile }),
        className
      )}
      {...props}
    >
      <div>{leftColumn}</div>
      <div>{rightColumn}</div>
    </div>
  )
}
