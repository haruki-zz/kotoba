import { Badge } from '@/renderer/components/ui/badge'

type PageHeaderProps = {
  app_name: string
  page_label: string
  title: string
  description: string
}

export const PageHeader = ({ app_name, page_label, title, description }: PageHeaderProps) => (
  <header className="space-y-4">
    <div className="flex flex-wrap items-center gap-3">
      <Badge variant="secondary">{app_name}</Badge>
      <Badge variant="outline">{page_label}</Badge>
    </div>
    <div className="space-y-2">
      <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">{title}</h1>
      <p className="max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base">
        {description}
      </p>
    </div>
  </header>
)
