import type { Constraint, SectionState } from '../../types'
import { clsx } from 'clsx'

export interface ConstraintsPanelProps {
  state: SectionState<Constraint[]>
  onRefresh: () => void
}

export function ConstraintsPanel({ state, onRefresh }: ConstraintsPanelProps) {
  return (
    <div className="rounded-3xl border border-border bg-muted/20 p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-muted-foreground">Constraints</p>
        <button
          type="button"
          className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground"
          onClick={onRefresh}
        >
          Refresh
        </button>
        {state.updatedAt ? (
          <span className="text-xs text-muted-foreground">
            Updated {new Date(state.updatedAt).toLocaleTimeString()}
          </span>
        ) : null}
      </div>
      {state.error ? (
        <p className="text-sm text-danger">{state.error}</p>
      ) : state.data.length ? (
        <ul className="flex flex-wrap gap-2">
          {state.data.map((constraint) => (
            <li
              key={constraint.id}
              className={clsx(
                'inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium',
                constraint.source === 'ai' ? 'border-blue-500/60 text-blue-500' : 'border-foreground/50 text-foreground',
              )}
            >
              <span className="text-muted-foreground">{constraint.source === 'ai' ? 'AI' : 'User'}</span>
              {constraint.text}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">No constraints yet.</p>
      )}
    </div>
  )
}
