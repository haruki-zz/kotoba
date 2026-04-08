import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/renderer/lib/utils'

const alert_variants = cva(
  'relative w-full rounded-[1.75rem] border border-white/25 px-5 py-4 text-sm shadow-[0_18px_40px_-30px_rgba(14,54,27,0.35)] backdrop-blur-xl',
  {
    variants: {
      variant: {
        default: 'bg-white/62 text-card-foreground',
        destructive:
          'border-destructive/20 bg-white/88 text-destructive dark:border-destructive/30',
        success: 'border-border bg-white/88 text-foreground',
        warning: 'border-border bg-white/88 text-foreground',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

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
