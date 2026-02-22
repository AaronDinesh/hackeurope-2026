import type { ReactNode } from 'react'
import { clsx } from 'clsx'

interface TabNavigationProps<T extends string> {
  tabs: Array<{ id: T; label: string; element: ReactNode }>
  activeTab: T
  onChange: (tab: T) => void
}

export function TabNavigation<T extends string>({ tabs, activeTab, onChange }: TabNavigationProps<T>) {
  return (
    <div className="flex items-center gap-2 border-b border-border px-4 py-3 text-sm font-medium">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          className={clsx(
            'rounded-full px-4 py-2 transition',
            tab.id === activeTab
              ? 'bg-foreground text-background shadow'
              : 'bg-muted text-muted-foreground hover:text-foreground',
          )}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
