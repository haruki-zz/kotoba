import * as React from 'react'

import { cn } from '@/renderer/lib/utils'

export type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement>

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(
        'flex h-12 w-full appearance-none rounded-full border border-transparent bg-input px-4 py-3 pr-10 text-sm text-foreground shadow-[inset_0_0_0_1px_rgba(255,255,255,0.22)] transition-all focus-visible:border-primary/18 focus-visible:bg-white/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      {...props}
    >
      {children}
    </select>
  )
)

Select.displayName = 'Select'
