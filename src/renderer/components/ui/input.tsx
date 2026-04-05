import * as React from 'react'

import { cn } from '@/renderer/lib/utils'

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', ...props }, ref) => (
    <input
      ref={ref}
      type={type}
      className={cn(
        'flex h-12 w-full rounded-full border border-transparent bg-input px-4 py-3 text-sm text-foreground shadow-[inset_0_0_0_1px_rgba(255,255,255,0.22)] transition-all file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:border-primary/18 focus-visible:bg-white/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      {...props}
    />
  )
)

Input.displayName = 'Input'
