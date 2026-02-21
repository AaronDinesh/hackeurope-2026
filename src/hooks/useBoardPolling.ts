import { useEffect } from 'react'
import type { BoardSummary } from '../types'
import { useBoardStore } from '../stores/board'

type FetchBoards = () => Promise<BoardSummary[]>

export const useBoardPolling = (fetchBoards: FetchBoards, intervalMs = 10_000) => {
  const setBoards = useBoardStore((state) => state.setBoards)

  useEffect(() => {
    let timer: number | null = null
    let cancelled = false

    const poll = async () => {
      try {
        const boards = await fetchBoards()
        if (!cancelled && Array.isArray(boards) && boards.length) {
          setBoards(boards)
        }
      } catch (error) {
        console.error('Failed to fetch board list', error)
      }
    }

    poll()
    timer = window.setInterval(poll, intervalMs)

    return () => {
      cancelled = true
      if (timer) window.clearInterval(timer)
    }
  }, [fetchBoards, intervalMs, setBoards])
}
