import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { BoardSummary } from '../types'

interface BoardStore {
  boards: BoardSummary[]
  activeBoardId: string | null
  setBoards: (boards: BoardSummary[]) => void
  addBoard: (board: BoardSummary) => void
  setActiveBoard: (boardId: string) => void
  updateBoard: (boardId: string, updater: Partial<BoardSummary>) => void
}

export const useBoardStore = create<BoardStore>()(
  persist(
    (set, get) => ({
      boards: [],
      activeBoardId: null,
      setBoards: (boards) =>
        set(() => ({
          boards,
          activeBoardId: boards.length ? boards[0].id : null,
        })),
      addBoard: (board) =>
        set((state) => ({
          boards: [...state.boards, board],
          activeBoardId: state.activeBoardId ?? board.id,
        })),
      setActiveBoard: (boardId) => set({ activeBoardId: boardId }),
      updateBoard: (boardId, updater) =>
        set((state) => ({
          boards: state.boards.map((board) =>
            board.id === boardId ? { ...board, ...updater } : board,
          ),
        })),
    }),
    {
      name: 'miro-board-cache',
      version: 1,
    },
  ),
)
