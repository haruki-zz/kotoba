import type { ReactNode } from 'react'

type AppShellProps = {
  header: ReactNode
  navigation: ReactNode
  notice?: ReactNode
  children: ReactNode
}

export const AppShell = ({ header, navigation, notice, children }: AppShellProps) => (
  <main className="relative min-h-screen overflow-hidden">
    <div className="pointer-events-none absolute inset-0">
      <div className="absolute -left-20 top-10 h-64 w-64 rounded-full bg-white blur-3xl" />
      <div className="absolute right-0 top-0 h-72 w-72 rounded-full bg-slate-100/70 blur-3xl" />
      <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-stone-100/80 blur-3xl" />
    </div>

    <div className="relative mx-auto flex min-h-screen w-full max-w-[1600px] flex-col gap-4 px-3 py-3 sm:gap-5 sm:px-4 sm:py-4 lg:px-5 xl:flex-row xl:gap-6 xl:px-6 xl:py-6">
      <aside className="shrink-0 xl:sticky xl:top-6 xl:h-[calc(100vh-3rem)] xl:w-[280px] 2xl:w-[300px]">
        <div className="h-full rounded-[2rem] bg-white/90 p-3 backdrop-blur-2xl shadow-[0_32px_80px_-48px_rgba(31,42,31,0.18)] sm:p-4 xl:rounded-[2.25rem] xl:p-5">
          {navigation}
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col gap-5">
        {header}
        {notice}
        <section className="min-w-0 pb-6">{children}</section>
      </div>
    </div>
  </main>
)
