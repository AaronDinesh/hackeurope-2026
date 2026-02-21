import { useState } from 'react'
import type { Constraint, SectionState } from '../../types'
import { clsx } from 'clsx'
import { useContentStore } from '../../stores/content'
import { apiClient } from '../../services/api'
import { useToastStore } from '../../stores/toast'
import { PromptDialog } from '../modals/PromptDialog'

export interface ConstraintsPanelProps {
  state: SectionState<Constraint[]>
  onRefresh: () => void
}

export function ConstraintsPanel({ state, onRefresh }: ConstraintsPanelProps) {
  const addConstraint = useContentStore((s) => s.addConstraint)
  const updateConstraint = useContentStore((s) => s.updateConstraint)
  const removeConstraint = useContentStore((s) => s.removeConstraint)
  const addToast = useToastStore((s) => s.addToast)
  const [dialog, setDialog] = useState<{ mode: 'create' | 'edit'; constraint?: Constraint } | null>(null)

  return (
    <div className="rounded-3xl border border-border bg-muted/20 p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-muted-foreground">Constraints</p>
        <div className="flex gap-2">
          <button
            type="button"
            className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground"
            onClick={onRefresh}
          >
            Refresh
          </button>
          <button
            type="button"
            className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground"
            onClick={() => setDialog({ mode: 'create' })}
          >
            Add
          </button>
        </div>
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
              <div className="flex gap-1">
                <button
                  type="button"
                  className="text-muted-foreground"
                  onClick={() => setDialog({ mode: 'edit', constraint })}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className="text-muted-foreground"
                  onClick={async () => {
                    const confirmed = window.confirm('Delete this constraint?')
                    if (!confirmed) return
                    try {
                      await apiClient.deleteConstraint(constraint.id)
                      removeConstraint(constraint.id)
                    } catch (error) {
                      addToast({ type: 'error', message: (error as Error).message ?? 'Delete failed' })
                    }
                  }}
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">No constraints yet.</p>
      )}
      <PromptDialog
        title={dialog?.mode === 'edit' ? 'Edit Constraint' : 'Add Constraint'}
        confirmLabel={dialog?.mode === 'edit' ? 'Save' : 'Add'}
        isOpen={dialog !== null}
        initialValue={dialog?.constraint?.text ?? ''}
        onClose={() => setDialog(null)}
        onSubmit={async (text) => {
          try {
            if (dialog?.mode === 'edit' && dialog.constraint) {
              const updated = await apiClient.updateConstraint(dialog.constraint.id, { text })
              updateConstraint(updated)
              addToast({ type: 'success', message: 'Constraint updated' })
            } else {
              const created = await apiClient.createConstraint(text)
              addConstraint(created)
              addToast({ type: 'success', message: 'Constraint added' })
            }
          } catch (error) {
            addToast({ type: 'error', message: (error as Error).message ?? 'Unable to save constraint' })
          }
        }}
      />
    </div>
  )
}
