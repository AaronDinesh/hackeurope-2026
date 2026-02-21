import type { ReactNode } from 'react'
import type { SectionState, HexColor } from '../../types'

interface HexPaletteProps {
  state: SectionState<HexColor[]>
  onRefresh: () => void
  onRegenerate: () => void
}

export function HexPalette({ state, onRefresh, onRegenerate }: HexPaletteProps) {
  if (state.isLoading && state.data.length === 0) {
    return <CardShell title="Hex Codes">Generating palette…</CardShell>
  }

  if (state.error) {
    return <CardShell title="Hex Codes">{state.error}</CardShell>
  }

  if (!state.data.length) {
    return <CardShell title="Hex Codes">No palette yet.</CardShell>
  }

  return (
    <CardShell title="Hex Codes" onRefresh={onRefresh} onRegenerate={onRegenerate}>
      <div className="grid grid-cols-2 gap-3">
        {state.data.map((color) => (
          <div key={color.id} className="flex items-center gap-3 rounded-xl border border-border/70 bg-background/60 p-3">
            <span
              className="h-10 w-10 rounded-lg border border-border"
              style={{ backgroundColor: color.hex }}
            />
            <div className="text-sm">
              <p className="font-semibold">{color.name ?? 'Color'}</p>
              <p className="text-muted-foreground">{color.hex}</p>
            </div>
          </div>
        ))}
      </div>
    </CardShell>
  )
}

function CardShell({ title, children, onRefresh, onRegenerate }: { title: string; children: ReactNode; onRefresh?: () => void; onRegenerate?: () => void }) {
  return (
    <div className="rounded-3xl border border-border bg-muted/20 p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-muted-foreground">{title}</p>
        <div className="flex gap-2">
          {onRefresh ? (
            <button
              type="button"
              className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground"
              onClick={onRefresh}
            >
              Refresh
            </button>
          ) : null}
          {onRegenerate ? (
            <button
              type="button"
              className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground"
              onClick={onRegenerate}
            >
              Regenerate
            </button>
          ) : null}
        </div>
      </div>
      <div className="text-sm text-muted-foreground">{children}</div>
    </div>
  )
}
