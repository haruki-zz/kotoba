import type { ReactNode } from 'react'

type AppShellProps = {
  header: ReactNode
  navigation: ReactNode
  notice?: ReactNode
  children: ReactNode
}

export const AppShell = ({ header, navigation, notice, children }: AppShellProps) => (
  <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(153,246,228,0.35),_transparent_40%),linear-gradient(180deg,_rgba(255,255,255,0.98),_rgba(241,245,249,0.96))]">
    <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      {header}
      {notice}
      {navigation}
      <section>{children}</section>
    </div>
  </main>
)
