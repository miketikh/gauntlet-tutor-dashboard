import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const sectionContainerVariants = cva("", {
  variants: {
    variant: {
      default: "space-y-4",
      bordered: "space-y-4 rounded-lg border border-border p-6",
      card: "",
    },
  },
  defaultVariants: {
    variant: "default",
  },
})

export interface SectionContainerProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof sectionContainerVariants> {
  title?: string
  description?: string
  actions?: React.ReactNode
}

export function SectionContainer({
  title,
  description,
  children,
  actions,
  variant = "default",
  className,
  ...props
}: SectionContainerProps) {
  // Card variant uses Card component
  if (variant === "card") {
    return (
      <Card className={className} {...props}>
        {(title || description || actions) && (
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                {title && <CardTitle>{title}</CardTitle>}
                {description && <CardDescription>{description}</CardDescription>}
              </div>
              {actions && <div className="flex items-center gap-2">{actions}</div>}
            </div>
          </CardHeader>
        )}
        <CardContent>{children}</CardContent>
      </Card>
    )
  }

  // Default and bordered variants
  return (
    <div className={cn(sectionContainerVariants({ variant }), className)} {...props}>
      {(title || description || actions) && (
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            {title && (
              <h3 className="text-lg font-semibold tracking-tight text-foreground">
                {title}
              </h3>
            )}
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      <div>{children}</div>
    </div>
  )
}
