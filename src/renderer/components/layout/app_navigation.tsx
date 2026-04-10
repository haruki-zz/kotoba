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
  <div className="flex h-full flex-col gap-4 xl:gap-6">
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-primary shadow-[inset_0_0_0_1px_rgba(31,42,31,0.08)]">
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

    <nav
      aria-label={aria_label}
      className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-1"
    >
      {items.map((item) => {
        const is_active = item.value === value

        return (
          <button
            key={item.value}
            aria-current={is_active ? 'page' : undefined}
            className={cn(
              'group flex items-center gap-3 rounded-[1.5rem] px-4 py-3 text-left transition-all duration-200 xl:gap-4 xl:rounded-full xl:px-5 xl:py-4',
              is_active
                ? 'bg-neutral-50 text-foreground shadow-[0_18px_45px_-28px_rgba(31,42,31,0.16)]'
                : 'text-muted-foreground hover:bg-neutral-50 hover:text-foreground'
            )}
            onClick={() => on_value_change(item.value)}
            type="button"
          >
            <span
              className={cn(
                'flex h-10 w-10 items-center justify-center rounded-full transition-colors',
                is_active ? 'bg-neutral-100 text-foreground' : 'bg-neutral-50 text-muted-foreground'
              )}
            >
              <span className="material-symbols-outlined">{item.icon}</span>
            </span>
            <span className="flex min-w-0 flex-1 items-center justify-between gap-2">
              <span className="font-headline text-sm font-bold tracking-[0.03em] leading-none">
                {item.label}
              </span>
              <span
                className={cn(
                  'hidden h-2.5 w-2.5 rounded-full transition-colors xl:block',
                  is_active ? 'bg-neutral-400' : 'bg-transparent group-hover:bg-neutral-300'
                )}
              />
            </span>
          </button>
        )
      })}
    </nav>
  </div>
)
