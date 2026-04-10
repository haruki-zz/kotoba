import { Badge } from '@/renderer/components/ui/badge'

type PageHeaderProps = {
  app_name: string
  page_label: string
  title: string
  description?: string
}

export const PageHeader = ({ app_name, page_label, title, description }: PageHeaderProps) => (
  <header className="rounded-[2rem] bg-white/94 px-5 py-5 shadow-[0_30px_80px_-52px_rgba(31,42,31,0.14)] backdrop-blur-2xl sm:px-6 sm:py-6 lg:px-8 lg:py-8">
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Badge variant="secondary">{app_name}</Badge>
        <Badge variant="outline">{page_label}</Badge>
      </div>
      <div className="space-y-2">
        <h1 className="font-headline text-[clamp(2rem,4vw,2.75rem)] font-extrabold tracking-tight text-foreground">
          {title}
        </h1>
        {description ? (
          <p className="max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base sm:leading-7">
            {description}
          </p>
        ) : null}
      </div>
    </div>
  </header>
)
