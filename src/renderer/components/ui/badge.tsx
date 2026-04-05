import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/renderer/lib/utils'

const badge_variants = cva(
  'inline-flex items-center rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] transition-colors',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary-container/70 text-primary',
        secondary: 'border-transparent bg-white/65 text-foreground',
        outline: 'border border-primary/12 bg-white/45 text-muted-foreground',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badge_variants> {}

export const Badge = ({ className, variant, ...props }: BadgeProps) => (
  <div className={cn(badge_variants({ variant }), className)} {...props} />
)
