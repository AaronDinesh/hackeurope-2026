import { useState } from 'react'
import { apiClient } from '../../services/api'
import { useSectionLoader } from '../../hooks/useSectionLoader'
import { useToastStore } from '../../stores/toast'
import { useContentStore } from '../../stores/content'
import { PromptDialog } from '../modals/PromptDialog'

export function MoodBoardPanel() {
  const { state: moodBoard, reload } = useSectionLoader('moodBoard', apiClient.fetchMoodBoard)
  const setSectionData = useContentStore((state) => state.setSectionData)
  const addToast = useToastStore((state) => state.addToast)
  const [regenerateOpen, setRegenerateOpen] = useState(false)
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null)

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center justify-between border-b border-border/60 px-6 py-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">Mood Board</p>
          {moodBoard.updatedAt ? (
            <p className="text-xs text-muted-foreground">
              Updated {new Date(moodBoard.updatedAt).toLocaleTimeString()}
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
      {moodBoard.isLoading && moodBoard.data.length === 0 ? (
        <Placeholder message="Loading mood board…" />
      ) : moodBoard.error ? (
        <Placeholder message={moodBoard.error} tone="error" />
      ) : moodBoard.data.length ? (
        <div className="grid flex-1 grid-cols-2 gap-4 p-6 lg:grid-cols-3">
          {moodBoard.data.map((image) => (
            <figure
              key={image.id}
              className="cursor-pointer rounded-2xl border border-border/70 bg-muted/40 shadow-sm transition hover:-translate-y-1"
              onClick={() => {
                setSelectedImageId(image.id)
                setRegenerateOpen(true)
              }}
            >
              <div className="aspect-square overflow-hidden rounded-t-2xl bg-muted">
                <img src={image.imageUrl} alt={image.title || 'Mood board'} className="h-full w-full object-cover" />
              </div>
              <figcaption className="p-3 text-sm">
                <p className="font-semibold text-foreground">{image.title ?? 'Untitled'}</p>
                {image.description ? (
                  <p className="text-xs text-muted-foreground">{image.description}</p>
                ) : null}
              </figcaption>
            </figure>
          ))}
        </div>
      ) : (
        <Placeholder message="No mood board images yet." />
      )}
      <PromptDialog
        title={selectedImageId ? 'Update Mood Tile' : 'Regenerate Mood Board'}
        isOpen={regenerateOpen}
        onClose={() => {
          setRegenerateOpen(false)
          setSelectedImageId(null)
        }}
        onSubmit={async (prompt) => {
          try {
            const images = await apiClient.regenerateMoodBoard(prompt, selectedImageId ?? undefined)
            setSectionData('moodBoard', images)
            addToast({ type: 'success', message: 'Mood board updated' })
          } catch (error) {
            addToast({ type: 'error', message: (error as Error).message ?? 'Failed to regenerate' })
          } finally {
            setSelectedImageId(null)
            setRegenerateOpen(false)
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
      <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
        Mood Board
      </p>
    </div>
  )
}
