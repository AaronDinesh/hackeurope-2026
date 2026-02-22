import { useState } from 'react'
import { ConstraintsPanel } from '../text/ConstraintsPanel'
import { HexPalette } from '../text/HexPalette'
import { SummaryCard } from '../text/SummaryCard'
import { PromptDialog } from '../modals/PromptDialog'
import { useToastStore } from '../../stores/toast'
import { useContentStore } from '../../stores/content'

export function TextPanel() {
  const hexCodes = useContentStore((state) => state.hexCodes)
  const constraints = useContentStore((state) => state.constraints)
  const summary = useContentStore((state) => state.summary)
  const setSectionData = useContentStore((state) => state.setSectionData)
  const addToast = useToastStore((state) => state.addToast)
  const [promptTarget, setPromptTarget] = useState<'hex' | 'summary' | null>(null)

  return (
    <div className="flex h-full flex-col gap-6 p-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <HexPalette
          state={hexCodes}
          onRefresh={() => addToast({ type: 'info', message: 'Submit a new prompt to refresh all sections.' })}
          onRegenerate={() => setPromptTarget('hex')}
        />
        <ConstraintsPanel
          state={constraints}
          onRefresh={() => addToast({ type: 'info', message: 'Submit a new prompt to refresh all sections.' })}
        />
      </div>
      <SummaryCard
        state={summary}
        onRefresh={() => addToast({ type: 'info', message: 'Submit a new prompt to refresh all sections.' })}
        onRegenerate={() => setPromptTarget('summary')}
      />
      <PromptDialog
        title={promptTarget === 'hex' ? 'Regenerate Hex Palette' : 'Regenerate Summary'}
        isOpen={promptTarget !== null}
        onClose={() => setPromptTarget(null)}
        onSubmit={async (prompt) => {
          try {
            if (promptTarget === 'hex') {
              const colors = hexCodes.data.map((item) => ({ ...item, name: item.name ?? prompt }))
              setSectionData('hexCodes', colors)
              addToast({ type: 'success', message: 'Palette labels updated locally' })
            } else if (promptTarget === 'summary') {
              if (summary.data) {
                setSectionData('summary', {
                  ...summary.data,
                  content: `${summary.data.content}\n\n${prompt}`,
                  updatedAt: Date.now(),
                })
                addToast({ type: 'success', message: 'Summary note updated locally' })
              }
            }
          } catch (error) {
            addToast({ type: 'error', message: (error as Error).message ?? 'Regeneration failed' })
          } finally {
            setPromptTarget(null)
          }
        }}
      />
    </div>
  )
}
