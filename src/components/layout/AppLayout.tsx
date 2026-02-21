import { useMemo, useState } from 'react'
import { TabNavigation } from './TabNavigation'
import { MoodBoardPanel } from '../panels/MoodBoardPanel'
import { StoryboardPanel } from '../panels/StoryboardPanel'
import { TextPanel } from '../panels/TextPanel'
import { FinalOutputPanel } from '../panels/FinalOutputPanel'
import { ChatPanel } from '../panels/chat/ChatPanel'

export type TabId = 'mood' | 'storyboard' | 'text' | 'final'

interface AppLayoutProps {
  onOpenSettings: () => void
}

const TAB_LABELS: Record<TabId, string> = {
  mood: 'Mood Board',
  storyboard: 'Storyboard',
  text: 'Text',
  final: 'Final Output',
}

export function AppLayout({ onOpenSettings }: AppLayoutProps) {
  const [activeTab, setActiveTab] = useState<TabId>('mood')

  const tabs = useMemo(
    () => [
      { id: 'mood' as const, label: TAB_LABELS.mood, element: <MoodBoardPanel /> },
      { id: 'storyboard' as const, label: TAB_LABELS.storyboard, element: <StoryboardPanel /> },
      { id: 'text' as const, label: TAB_LABELS.text, element: <TextPanel /> },
      { id: 'final' as const, label: TAB_LABELS.final, element: <FinalOutputPanel /> },
    ],
    [],
  )

  return (
    <div className="flex h-full w-full">
      <div className="flex min-w-0 flex-1 flex-col border-r border-border bg-background/95">
        <header className="flex items-center justify-between border-b border-border px-6 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">Gemini Creative Studio</p>
            <h1 className="text-2xl font-semibold">Workspace</h1>
          </div>
          <button
            type="button"
            onClick={onOpenSettings}
            className="rounded-full border border-border px-4 py-2 text-sm font-semibold"
          >
            Settings
          </button>
        </header>
        <TabNavigation tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
        <div className="min-h-0 flex-1 overflow-y-auto bg-background">
          {tabs.find((tab) => tab.id === activeTab)?.element ?? null}
        </div>
      </div>
      <div className="flex w-[32%] min-w-[360px] max-w-md flex-col bg-background">
        <ChatPanel focusTab={setActiveTab} onOpenSettings={onOpenSettings} />
      </div>
    </div>
  )
}
