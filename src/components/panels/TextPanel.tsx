import { ConstraintsPanel } from '../text/ConstraintsPanel'
import { HexPalette } from '../text/HexPalette'
import { SummaryCard } from '../text/SummaryCard'
import { useContentStore } from '../../stores/content'

export function TextPanel() {
  const hexCodes = useContentStore((state) => state.hexCodes)
  const constraints = useContentStore((state) => state.constraints)
  const summary = useContentStore((state) => state.summary)

  return (
    <div className="flex h-full flex-col gap-6 p-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <HexPalette state={hexCodes} />
        <ConstraintsPanel state={constraints} />
      </div>
      <SummaryCard state={summary} />
    </div>
  )
}
