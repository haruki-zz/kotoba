import { Badge } from '@/renderer/components/ui/badge'

type PageHeaderProps = {
  app_name: string
  page_label: string
  title: string
  description: string
}

export const PageHeader = ({ app_name, page_label, title, description }: PageHeaderProps) => (
  <header className="rounded-[2.25rem] bg-white/58 px-6 py-6 shadow-[0_30px_80px_-52px_rgba(14,54,27,0.42)] backdrop-blur-2xl sm:px-8 sm:py-8">
    <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="secondary">{app_name}</Badge>
          <Badge variant="outline">{page_label}</Badge>
        </div>
        <div className="space-y-3">
          <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-primary/75">
            学習ワークスペース
          </p>
          <h1 className="font-headline text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl lg:text-[2.75rem]">
            {title}
          </h1>
          <p className="max-w-3xl text-sm leading-7 text-muted-foreground sm:text-base">
            {description}
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:w-[360px]">
        <div className="rounded-[1.75rem] bg-[#f7fff0] px-5 py-4 shadow-[inset_0_0_0_1px_rgba(48,104,0,0.06)]">
          <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-primary/70">
            保存方式
          </p>
          <p className="mt-2 font-headline text-lg font-extrabold text-foreground">ローカル優先</p>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            JSON とキーチェーンで安全に保持
          </p>
        </div>
        <div className="rounded-[1.75rem] bg-[#effff9] px-5 py-4 shadow-[inset_0_0_0_1px_rgba(25,237,253,0.12)]">
          <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-primary/70">
            学習リズム
          </p>
          <p className="mt-2 font-headline text-lg font-extrabold text-foreground">SM-2 ベース</p>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            追加、復習、活動の流れを一貫表示
          </p>
        </div>
      </div>
    </div>
  </header>
)
