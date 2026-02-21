import { useContentStore } from '../../stores/content'

export function MoodBoardPanel() {
  const moodBoard = useContentStore((state) => state.moodBoard)

  if (moodBoard.isLoading && moodBoard.data.length === 0) {
    return <Placeholder message="Loading mood board…" />
  }

  if (moodBoard.error) {
    return <Placeholder message={moodBoard.error} tone="error" />
  }

  if (!moodBoard.data.length) {
    return <Placeholder message="No mood board images yet." />
  }

  return (
    <div className="grid grid-cols-2 gap-4 p-6 lg:grid-cols-3">
      {moodBoard.data.map((image) => (
        <figure
          key={image.id}
          className="rounded-2xl border border-border/70 bg-muted/40 shadow-sm"
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
