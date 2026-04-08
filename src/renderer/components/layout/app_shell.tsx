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

    <div className="relative mx-auto flex min-h-screen w-full max-w-[1600px] flex-col gap-5 px-4 py-4 md:flex-row md:gap-6 md:px-6 md:py-6">
      <aside className="shrink-0 md:sticky md:top-6 md:h-[calc(100vh-3rem)] md:w-[290px]">
        <div className="h-full rounded-[2.25rem] bg-white/90 p-4 backdrop-blur-2xl shadow-[0_32px_80px_-48px_rgba(31,42,31,0.18)] md:p-5">
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
