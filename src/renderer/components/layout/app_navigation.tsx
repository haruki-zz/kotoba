import { cn } from '@/renderer/lib/utils'

export type AppNavigationItem<TValue extends string> = {
  value: TValue
  label: string
  icon: string
}

type AppNavigationProps<TValue extends string> = {
  aria_label: string
  items: AppNavigationItem<TValue>[]
  value: TValue
  on_value_change: (value: TValue) => void
}

export const AppNavigation = <TValue extends string>({
  aria_label,
  items,
  value,
  on_value_change,
}: AppNavigationProps<TValue>) => (
  <div className="flex h-full flex-col gap-6">
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-linear-to-br from-primary to-[#4b8d16] text-primary-foreground shadow-[0_20px_40px_-24px_rgba(48,104,0,0.8)]">
          <span className="material-symbols-outlined">spa</span>
        </div>
        <div>
          <p className="font-headline text-xl font-extrabold tracking-tight text-primary">Kotoba</p>
          <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-muted-foreground">
            学習
          </p>
        </div>
      </div>
    </div>

    <nav aria-label={aria_label} className="grid gap-2">
      {items.map((item) => {
        const is_active = item.value === value

        return (
          <button
            key={item.value}
            aria-current={is_active ? 'page' : undefined}
            className={cn(
              'group flex items-center gap-4 rounded-full px-5 py-4 text-left transition-all duration-200',
              is_active
                ? 'bg-white/82 text-foreground shadow-[0_18px_45px_-28px_rgba(14,54,27,0.4)]'
                : 'text-muted-foreground hover:bg-white/50 hover:text-foreground'
            )}
            onClick={() => on_value_change(item.value)}
            type="button"
          >
            <span
              className={cn(
                'flex h-10 w-10 items-center justify-center rounded-full transition-colors',
                is_active ? 'bg-primary-container/80 text-primary' : 'bg-white/45 text-primary/80'
              )}
            >
              <span className="material-symbols-outlined">{item.icon}</span>
            </span>
            <span className="flex min-w-0 flex-1 items-center justify-between gap-3">
              <span className="font-headline text-sm font-bold tracking-[0.03em]">
                {item.label}
              </span>
              <span
                className={cn(
                  'h-2.5 w-2.5 rounded-full transition-colors',
                  is_active ? 'bg-primary' : 'bg-transparent group-hover:bg-primary/35'
                )}
              />
            </span>
          </button>
        )
      })}
    </nav>
  </div>
)
