import { ScrollArea } from '@/renderer/components/ui/scroll_area'
import { Tabs, TabsList, TabsTrigger } from '@/renderer/components/ui/tabs'

export type AppNavigationItem<TValue extends string> = {
  value: TValue
  label: string
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
  <ScrollArea className="w-full whitespace-nowrap">
    <Tabs value={value} onValueChange={(next_value) => on_value_change(next_value as TValue)}>
      <TabsList aria-label={aria_label} className="w-max min-w-full justify-start">
        {items.map((item) => (
          <TabsTrigger key={item.value} value={item.value}>
            {item.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  </ScrollArea>
)
