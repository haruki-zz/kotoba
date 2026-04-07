import { Badge } from '@/renderer/components/ui/badge'

type PageHeaderProps = {
  app_name: string
  page_label: string
  title: string
  description?: string
}

export const PageHeader = ({ app_name, page_label, title, description }: PageHeaderProps) => (
  <header className="rounded-[2.25rem] bg-white/58 px-6 py-6 shadow-[0_30px_80px_-52px_rgba(14,54,27,0.42)] backdrop-blur-2xl sm:px-8 sm:py-8">
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Badge variant="secondary">{app_name}</Badge>
        <Badge variant="outline">{page_label}</Badge>
      </div>
      <div className="space-y-2">
        <h1 className="font-headline text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl lg:text-[2.75rem]">
          {title}
        </h1>
        {description ? (
          <p className="max-w-3xl text-sm leading-7 text-muted-foreground sm:text-base">
            {description}
          </p>
        ) : null}
      </div>
    </div>
  </header>
)
