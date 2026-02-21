import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Message, MessageRole } from '../types'

interface ChatStore {
  messages: Message[]
  isLoading: boolean
  currentTask: string | null
  addMessage: (payload: { role: MessageRole; content: string; metadata?: Message['metadata'] }) => Message
  updateMessage: (id: string, updater: Partial<Message>) => void
  setLoading: (loading: boolean, task?: string | null) => void
  clearHistory: () => void
}

export const useChatStore = create<ChatStore>()(
  persist(
    (set, get) => ({
      messages: [],
      isLoading: false,
      currentTask: null,
      addMessage: ({ role, content, metadata }) => {
        const message: Message = {
          id: crypto.randomUUID(),
          role,
          content,
          timestamp: Date.now(),
          metadata,
        }
        set((state) => ({ messages: [...state.messages, message] }))
        return message
      },
      updateMessage: (id, updater) =>
        set((state) => ({
          messages: state.messages.map((message) =>
            message.id === id ? { ...message, ...updater } : message,
          ),
        })),
      setLoading: (loading, task = null) => set({ isLoading: loading, currentTask: task }),
      clearHistory: () => set({ messages: [] }),
    }),
    {
      name: 'chat-history',
      version: 1,
    },
  ),
)
