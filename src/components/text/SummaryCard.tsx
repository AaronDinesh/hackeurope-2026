import type { SectionState, SummaryDoc } from '../../types'

interface SummaryProps {
  state: SectionState<SummaryDoc | null>
}

export function SummaryCard({ state }: SummaryProps) {
  return (
    <div className="flex flex-1 flex-col rounded-3xl border border-border bg-muted/10 p-6 shadow-inner">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-muted-foreground">Summary</p>
        {state.updatedAt ? (
          <span className="text-xs text-muted-foreground">
            Updated {new Date(state.updatedAt).toLocaleTimeString()}
          </span>
        ) : null}
      </div>
      {state.error ? (
        <p className="text-sm text-danger">{state.error}</p>
      ) : state.data ? (
        <p className="whitespace-pre-wrap text-base text-foreground">{state.data.content}</p>
      ) : (
        <p className="text-sm text-muted-foreground">Summary not available yet.</p>
      )}
    </div>
  )
}
