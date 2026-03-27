import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/renderer/lib/utils'

const alert_variants = cva('relative w-full rounded-xl border px-4 py-3 text-sm', {
  variants: {
    variant: {
      default: 'border-border bg-card text-card-foreground',
      destructive:
        'border-destructive/40 bg-destructive/8 text-destructive dark:border-destructive/50',
      success: 'border-primary/25 bg-primary/8 text-foreground',
      warning: 'border-chart-4/40 bg-chart-4/10 text-foreground',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
})

export interface AlertProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof alert_variants> {}

export const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant, ...props }, ref) => (
    <div ref={ref} className={cn(alert_variants({ variant }), className)} {...props} />
  )
)

Alert.displayName = 'Alert'

export const AlertTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn('mb-1 font-medium leading-none tracking-tight', className)}
    {...props}
  />
))

AlertTitle.displayName = 'AlertTitle'

export const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('text-sm [&_p]:leading-relaxed', className)} {...props} />
))

AlertDescription.displayName = 'AlertDescription'
