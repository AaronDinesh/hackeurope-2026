import { useState } from 'react'
import { ConstraintsPanel } from '../text/ConstraintsPanel'
import { HexPalette } from '../text/HexPalette'
import { SummaryCard } from '../text/SummaryCard'
import { apiClient } from '../../services/api'
import { useSectionLoader } from '../../hooks/useSectionLoader'
import { PromptDialog } from '../modals/PromptDialog'
import { useToastStore } from '../../stores/toast'
import { useContentStore } from '../../stores/content'

export function TextPanel() {
  const { state: hexCodes, reload: reloadHex } = useSectionLoader('hexCodes', apiClient.fetchHexCodes)
  const { state: constraints, reload: reloadConstraints } = useSectionLoader('constraints', apiClient.fetchConstraints)
  const { state: summary, reload: reloadSummary } = useSectionLoader('summary', apiClient.fetchSummary)
  const setSectionData = useContentStore((state) => state.setSectionData)
  const addToast = useToastStore((state) => state.addToast)
  const [promptTarget, setPromptTarget] = useState<'hex' | 'summary' | null>(null)

  return (
    <div className="flex h-full flex-col gap-6 p-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <HexPalette state={hexCodes} onRefresh={reloadHex} onRegenerate={() => setPromptTarget('hex')} />
        <ConstraintsPanel state={constraints} onRefresh={reloadConstraints} />
      </div>
      <SummaryCard state={summary} onRefresh={reloadSummary} onRegenerate={() => setPromptTarget('summary')} />
      <PromptDialog
        title={promptTarget === 'hex' ? 'Regenerate Hex Palette' : 'Regenerate Summary'}
        isOpen={promptTarget !== null}
        onClose={() => setPromptTarget(null)}
        onSubmit={async (prompt) => {
          try {
            if (promptTarget === 'hex') {
              const colors = await apiClient.regenerateHexCodes(prompt)
              setSectionData('hexCodes', colors)
              addToast({ type: 'success', message: 'Palette updated' })
            } else if (promptTarget === 'summary') {
              const doc = await apiClient.regenerateSummary(prompt)
              setSectionData('summary', doc)
              addToast({ type: 'success', message: 'Summary updated' })
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
