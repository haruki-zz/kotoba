type EmptyStateProps = {
  title: string
  description: string
}

export const EmptyState = ({ title, description }: EmptyStateProps) => (
  <div className="rounded-[2rem] bg-white/52 px-6 py-6 text-sm shadow-[inset_0_0_0_1px_rgba(255,255,255,0.28)] backdrop-blur-xl">
    <p className="font-headline text-lg font-extrabold text-foreground">{title}</p>
    <p className="mt-2 leading-7 text-muted-foreground">{description}</p>
  </div>
)
