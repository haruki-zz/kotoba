import * as React from 'react'

import { cn } from '@/renderer/lib/utils'

export const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'rounded-[2rem] border border-white/30 bg-card text-card-foreground shadow-[0_28px_80px_-48px_rgba(14,54,27,0.35)] backdrop-blur-xl',
        className
      )}
      {...props}
    />
  )
)

Card.displayName = 'Card'

export const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex flex-col space-y-2 p-6 sm:p-8', className)} {...props} />
  )
)

CardHeader.displayName = 'CardHeader'

export const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h2
    ref={ref}
    className={cn('font-headline text-lg font-extrabold leading-none tracking-tight', className)}
    {...props}
  />
))

CardTitle.displayName = 'CardTitle'

export const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-sm leading-6 tracking-[0.01em] text-muted-foreground', className)}
    {...props}
  />
))

CardDescription.displayName = 'CardDescription'

export const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-6 pt-0 sm:p-8 sm:pt-0', className)} {...props} />
  )
)

CardContent.displayName = 'CardContent'

export const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex items-center p-6 pt-0 sm:p-8 sm:pt-0', className)}
      {...props}
    />
  )
)

CardFooter.displayName = 'CardFooter'
