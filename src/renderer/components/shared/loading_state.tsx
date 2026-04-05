type LoadingStateProps = {
  message: string
}

export const LoadingState = ({ message }: LoadingStateProps) => (
  <div className="flex items-center gap-3 rounded-full bg-white/62 px-5 py-3 text-sm text-muted-foreground shadow-[0_18px_40px_-30px_rgba(14,54,27,0.35)] backdrop-blur-xl">
    <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary/25 border-t-primary" />
    <span>{message}</span>
  </div>
)
