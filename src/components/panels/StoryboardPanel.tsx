import { useContentStore } from '../../stores/content'

export function StoryboardPanel() {
  const storyboard = useContentStore((state) => state.storyboard)

  if (storyboard.isLoading && storyboard.data.length === 0) {
    return <Placeholder message="Generating storyboard…" />
  }

  if (storyboard.error) {
    return <Placeholder message={storyboard.error} tone="error" />
  }

  if (!storyboard.data.length) {
    return <Placeholder message="Storyboard is empty." />
  }

  return (
    <div className="flex flex-col gap-4 p-6">
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
