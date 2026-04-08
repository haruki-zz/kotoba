import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/renderer/lib/utils'

const button_variants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-semibold tracking-[0.02em] transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.98]',
  {
    variants: {
      variant: {
        default:
          'bg-linear-to-br from-primary to-[#4b8d16] text-primary-foreground shadow-[0_18px_36px_-24px_rgba(48,104,0,0.9)] hover:-translate-y-0.5 hover:shadow-[0_24px_48px_-24px_rgba(48,104,0,0.72)]',
        secondary:
          'bg-linear-to-br from-secondary to-[#ea9a2f] text-secondary-foreground shadow-[0_18px_36px_-24px_rgba(217,119,6,0.62)] hover:-translate-y-0.5 hover:shadow-[0_24px_48px_-24px_rgba(217,119,6,0.5)]',
        outline:
          'border border-secondary/20 bg-secondary/10 text-secondary hover:-translate-y-0.5 hover:bg-secondary/16',
        ghost: 'text-secondary hover:bg-secondary/10 hover:text-secondary',
        destructive:
          'bg-linear-to-br from-destructive to-[#f2a33b] text-destructive-foreground shadow-[0_18px_36px_-24px_rgba(217,119,6,0.62)] hover:-translate-y-0.5',
      },
      size: {
        default: 'h-11 px-5 py-2.5',
        sm: 'h-9 px-4 text-xs',
        lg: 'h-[3.25rem] px-7 text-base',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof button_variants> {
  as_child?: boolean
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, as_child = false, ...props }, ref) => {
    const Component = as_child ? Slot : 'button'

    return (
      <Component
        className={cn(button_variants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)

Button.displayName = 'Button'
