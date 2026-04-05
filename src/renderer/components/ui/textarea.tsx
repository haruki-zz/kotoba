import * as React from 'react'

import { cn } from '@/renderer/lib/utils'

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        'flex min-h-28 w-full rounded-[1.75rem] border border-transparent bg-input px-4 py-3 text-sm text-foreground shadow-[inset_0_0_0_1px_rgba(255,255,255,0.22)] transition-all placeholder:text-muted-foreground focus-visible:border-primary/18 focus-visible:bg-white/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      {...props}
    />
  )
)

Textarea.displayName = 'Textarea'
