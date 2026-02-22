import { useState } from 'react'
import { useToastStore } from '../../stores/toast'
import { useContentStore } from '../../stores/content'
import { PromptDialog } from '../modals/PromptDialog'
import { useSessionStore } from '../../stores/sessions'
import { ensureImageAsset } from '../../services/imageStorage'
import type { MoodBoardImage } from '../../types'

export function MoodBoardPanel() {
  const sessionId = useSessionStore((state) => state.activeSessionId)
  const mapImages = async (items: MoodBoardImage[]) => {
    if (!sessionId) return items
    return Promise.all(
      items.map(async (image) => {
        const { imagePath, imageUrl } = await ensureImageAsset({
          sessionId,
          category: 'mood-board',
          itemId: image.id,
          imagePath: image.imagePath,
          imageUrl: image.imageUrl,
        })
        return { ...image, imagePath, imageUrl: imageUrl || image.imageUrl }
      }),
    )
  }

  const moodBoard = useContentStore((state) => state.moodBoard)
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
            onClick={() => {
              addToast({ type: 'info', message: 'Submit a new prompt to refresh all sections.' })
            }}
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
        moodBoard.data.length === 1 ? (
          <div className="flex flex-1 p-6">
            <figure
              key={moodBoard.data[0].id}
              className="flex h-full w-full cursor-pointer flex-col overflow-hidden rounded-2xl border border-border/70 bg-muted/40 shadow-sm"
              onClick={() => {
                setSelectedImageId(moodBoard.data[0].id)
                setRegenerateOpen(true)
              }}
            >
              <div className="min-h-0 flex-1 overflow-hidden rounded-t-2xl bg-muted/60">
                <img
                  src={moodBoard.data[0].imageUrl}
                  alt={moodBoard.data[0].title || 'Mood board'}
                  className="h-full w-full object-cover"
                />
              </div>
              <figcaption className="p-3 text-sm">
                <p className="font-semibold text-foreground">{moodBoard.data[0].title ?? 'Untitled'}</p>
                {moodBoard.data[0].description ? (
                  <p className="text-xs text-muted-foreground">{moodBoard.data[0].description}</p>
                ) : null}
              </figcaption>
            </figure>
          </div>
        ) : (
          <div className="grid flex-1 content-start auto-rows-max grid-cols-1 gap-4 p-6 md:grid-cols-2 lg:grid-cols-3">
            {moodBoard.data.map((image) => (
              <figure
                key={image.id}
                className="h-fit cursor-pointer overflow-hidden rounded-2xl border border-border/70 bg-muted/40 shadow-sm transition hover:-translate-y-1"
                onClick={() => {
                  setSelectedImageId(image.id)
                  setRegenerateOpen(true)
                }}
              >
                <div className="h-72 overflow-hidden rounded-t-2xl bg-muted/60">
                  <img src={image.imageUrl} alt={image.title || 'Mood board'} className="h-full w-full object-contain" />
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
        )
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
            const current = moodBoard.data
            const processed = await mapImages(
              current.map((image) =>
                image.id === (selectedImageId ?? image.id)
                  ? { ...image, promptSnippet: prompt }
                  : image,
              ),
            )
            setSectionData('moodBoard', processed)
            addToast({ type: 'success', message: 'Mood board note updated locally' })
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
