import { useState } from 'react'
import { apiClient } from '../../services/api'
import { useSectionLoader } from '../../hooks/useSectionLoader'
import { useToastStore } from '../../stores/toast'
import { useContentStore } from '../../stores/content'
import { PromptDialog } from '../modals/PromptDialog'

export function StoryboardPanel() {
  const { state: storyboard, reload } = useSectionLoader('storyboard', apiClient.fetchStoryboard)
  const addToast = useToastStore((state) => state.addToast)
  const setSectionData = useContentStore((state) => state.setSectionData)
  const [regenerateOpen, setRegenerateOpen] = useState(false)

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center justify-between border-b border-border/60 px-6 py-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">Storyboard</p>
          {storyboard.updatedAt ? (
            <p className="text-xs text-muted-foreground">
              Updated {new Date(storyboard.updatedAt).toLocaleTimeString()}
            </p>
          ) : null}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            className="rounded-full border border-border/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em]"
            onClick={reload}
          >
            Refresh
          </button>
          <button
            type="button"
            className="rounded-full border border-border/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em]"
            onClick={() => setRegenerateOpen(true)}
          >
            Regenerate
          </button>
        </div>
      </header>
      {storyboard.isLoading && storyboard.data.length === 0 ? (
        <Placeholder message="Generating storyboard…" />
      ) : storyboard.error ? (
        <Placeholder message={storyboard.error} tone="error" />
      ) : storyboard.data.length ? (
        <div className="flex flex-col gap-4 overflow-y-auto p-6">
          {storyboard.data
            .slice()
            .sort((a, b) => a.order - b.order)
            .map((scene) => (
              <div key={scene.id} className="flex flex-col gap-3 rounded-2xl border border-border/70 bg-muted/30 p-4">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">Scene {scene.order}</span>
                  {scene.timestamp ? <span>{scene.timestamp}</span> : null}
                </div>
                <div className="overflow-hidden rounded-xl bg-muted">
                  <img src={scene.imageUrl} alt={scene.title} className="h-full w-full object-cover" />
                </div>
                <div>
                  <p className="text-base font-semibold text-foreground">{scene.title}</p>
                  {scene.description ? (
                    <p className="text-sm text-muted-foreground">{scene.description}</p>
                  ) : null}
                </div>
              </div>
            ))}
        </div>
      ) : (
        <Placeholder message="Storyboard is empty." />
      )}
      <PromptDialog
        title="Regenerate Storyboard"
        isOpen={regenerateOpen}
        onClose={() => setRegenerateOpen(false)}
        onSubmit={async (prompt) => {
          try {
            const scenes = await apiClient.regenerateStoryboard(prompt)
            setSectionData('storyboard', scenes)
            addToast({ type: 'success', message: 'Storyboard updated' })
          } catch (error) {
            addToast({ type: 'error', message: (error as Error).message ?? 'Failed to regenerate' })
          }
        }}
      />
    </div>
  )
}

function Placeholder({ message, tone = 'neutral' }: { message: string; tone?: 'neutral' | 'error' }) {
  return (
    <div
      className={`flex h-full flex-col items-center justify-center gap-2 p-6 text-center text-muted-foreground ${
        tone === 'error' ? 'text-danger' : ''
      }`}
    >
      <p className="text-base">{message}</p>
      <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Storyboard</p>
    </div>
  )
}
