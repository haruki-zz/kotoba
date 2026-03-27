type LoadingStateProps = {
  message: string
}

export const LoadingState = ({ message }: LoadingStateProps) => (
  <div className="flex items-center gap-3 rounded-xl border border-border/80 bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
    <span className="h-4 w-4 animate-spin rounded-full border-2 border-border border-t-primary" />
    <span>{message}</span>
  </div>
)
