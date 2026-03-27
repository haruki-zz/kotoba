type EmptyStateProps = {
  title: string
  description: string
}

export const EmptyState = ({ title, description }: EmptyStateProps) => (
  <div className="rounded-xl border border-dashed border-border bg-muted/35 px-4 py-5 text-sm">
    <p className="font-medium text-foreground">{title}</p>
    <p className="mt-1 leading-6 text-muted-foreground">{description}</p>
  </div>
)
