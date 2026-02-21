import type { BoardSummary } from '../types'
import { useBoardStore } from '../stores/board'

const LIVE_EMBED_BASE = 'https://miro.com/app/live-embed'

export const buildBoardEmbedUrl = (boardId: string) => `${LIVE_EMBED_BASE}/${boardId}/?pres=1`

export const upsertBoardSummaries = (boards: BoardSummary[]) => {
  const store = useBoardStore.getState()
  if (!boards.length) return
  const deduped = [...boards]
  store.setBoards(deduped)
}
