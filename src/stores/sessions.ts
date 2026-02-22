import { create } from 'zustand'
import type { SessionListItem } from '../types'
import {
  createSessionSnapshot,
  deleteSession as deleteSessionRecord,
  listSessions,
  loadSessionSnapshot,
  updateSessionTitle,
  upsertSessionSnapshot,
  type SessionSnapshotPayload,
} from '../services/database'
import { useChatStore } from './chat'
import { useContentStore } from './content'
import { removeSessionImages } from '../services/imageStorage'

const DEFAULT_TITLE = 'New Conversation'
const SAVE_DEBOUNCE_MS = 1500
const LOCAL_CACHE_KEY = 'session-history-local-cache'
const memoryStore = new Map<string, { record: SessionListItem; snapshot: SessionSnapshotPayload }>()
let useMemoryStore = false
const isBrowser = typeof window !== 'undefined'

const createEmptySnapshot = (): SessionSnapshotPayload => ({
  messages: [],
  content: {
    moodBoard: [],
    storyboard: [],
    hexCodes: [],
    constraints: [],
    summary: null,
    finalOutputs: [],
  },
})

const cloneSnapshot = (snapshot: SessionSnapshotPayload): SessionSnapshotPayload =>
  JSON.parse(JSON.stringify(snapshot)) as SessionSnapshotPayload

const persistLocalCache = () => {
  if (!isBrowser) return
  try {
    const serialized = JSON.stringify(Array.from(memoryStore.values()))
    window.localStorage.setItem(LOCAL_CACHE_KEY, serialized)
  } catch (error) {
    console.warn('Unable to persist local session cache:', error)
  }
}

if (isBrowser) {
  const cached = window.localStorage.getItem(LOCAL_CACHE_KEY)
  if (cached) {
    try {
      const parsed = JSON.parse(cached) as Array<{ record: SessionListItem; snapshot: SessionSnapshotPayload }>
      parsed.forEach((entry) => {
        memoryStore.set(entry.record.id, {
          record: entry.record,
          snapshot: entry.snapshot,
        })
      })
    } catch (error) {
      console.warn('Failed to parse local session cache:', error)
      window.localStorage.removeItem(LOCAL_CACHE_KEY)
    }
  }
}

const memoryListSessions = () =>
  Array.from(memoryStore.values())
    .map((entry) => ({ ...entry.record }))
    .sort((a, b) => b.createdAt - a.createdAt)

const memoryLoadSnapshot = (id: string) => {
  const entry = memoryStore.get(id)
  if (!entry) return null
  return { record: { ...entry.record }, snapshot: cloneSnapshot(entry.snapshot) }
}

const memoryUpsert = (record: SessionListItem, snapshot: SessionSnapshotPayload) => {
  memoryStore.set(record.id, { record: { ...record }, snapshot: cloneSnapshot(snapshot) })
  persistLocalCache()
}

const memoryDelete = (id: string) => {
  memoryStore.delete(id)
  persistLocalCache()
}

const runTask = async <T>(task: () => Promise<T>, fallback: () => T | Promise<T>): Promise<T> => {
  if (useMemoryStore) {
    return await fallback()
  }
  try {
    return await task()
  } catch (error) {
    console.warn('SQL plugin unavailable, using in-memory session store instead.', error)
    useMemoryStore = true
    return await fallback()
  }
}

interface SessionStoreState {
  sessions: SessionListItem[]
  sessionMap: Record<string, SessionListItem>
  activeSessionId: string | null
  searchQuery: string
  isHydrating: boolean
  isInitialized: boolean
  initialize: () => Promise<void>
  createSession: () => Promise<void>
  renameSession: (id: string, title: string) => Promise<void>
  selectSession: (id: string) => Promise<void>
  deleteSession: (id: string) => Promise<void>
  setSearchQuery: (value: string) => void
  persistSnapshot: () => Promise<void>
  schedulePersist: () => void
}

export const useSessionStore = create<SessionStoreState>()((set, get) => {
  let chatUnsubscribe: (() => void) | null = null
  let contentUnsubscribe: (() => void) | null = null
  let persistTimer: ReturnType<typeof setTimeout> | null = null
  let hydrationRequestId = 0

  const refreshSessions = async () => {
    const rows = await runTask(() => listSessions(), () => memoryListSessions())
    const map: Record<string, SessionListItem> = {}
    rows.forEach((row) => {
      map[row.id] = row
    })
    set({ sessions: rows, sessionMap: map })
    return rows
  }

  const hydrateSession = async (sessionId: string) => {
    const requestId = ++hydrationRequestId
    set({ isHydrating: true })
    try {
      const snapshot = await runTask(() => loadSessionSnapshot(sessionId), () => memoryLoadSnapshot(sessionId))
      if (requestId !== hydrationRequestId) {
        return
      }
      if (snapshot) {
        useChatStore.getState().setMessages(snapshot.snapshot.messages)
        useContentStore.getState().hydrateFromSnapshot(snapshot.snapshot.content)
        set({ activeSessionId: sessionId })
      } else {
        useChatStore.getState().clearHistory()
        useContentStore.getState().clearContent()
      }
    } catch (error) {
      if (requestId === hydrationRequestId) {
        console.error('Failed to hydrate session', error)
      }
    } finally {
      if (requestId === hydrationRequestId) {
        set({ isHydrating: false })
      }
    }
  }

  const ensureSubscriptions = () => {
    if (!chatUnsubscribe) {
      chatUnsubscribe = useChatStore.subscribe((state) => state.messages, () => get().schedulePersist())
    }
    if (!contentUnsubscribe) {
      contentUnsubscribe = useContentStore.subscribe((state) => state.version, () => get().schedulePersist())
    }
  }

  return {
    sessions: [],
    sessionMap: {},
    activeSessionId: null,
    searchQuery: '',
    isHydrating: false,
    isInitialized: false,
    initialize: async () => {
      if (get().isInitialized) return
      let rows = await refreshSessions()
      let targetId = rows[0]?.id
      if (!targetId) {
        targetId = crypto.randomUUID()
        await runTask(
          () => createSessionSnapshot({ id: targetId, title: DEFAULT_TITLE }),
          async () => {
            const now = Date.now()
            memoryUpsert(
              { id: targetId, title: DEFAULT_TITLE, createdAt: now, updatedAt: now },
              createEmptySnapshot(),
            )
          },
        )
        rows = await refreshSessions()
      }
      await hydrateSession(targetId)
      set({ activeSessionId: targetId, isInitialized: true })
      ensureSubscriptions()
    },
    createSession: async () => {
      await get().persistSnapshot()
      const id = crypto.randomUUID()
      await runTask(
        () => createSessionSnapshot({ id, title: DEFAULT_TITLE }),
        async () => {
          const now = Date.now()
          memoryUpsert({ id, title: DEFAULT_TITLE, createdAt: now, updatedAt: now }, createEmptySnapshot())
        },
      )
      await refreshSessions()
      await hydrateSession(id)
    },
    renameSession: async (id, title) => {
      const nextTitle = title.trim() || DEFAULT_TITLE
      await runTask(
        () => updateSessionTitle(id, nextTitle),
        async () => {
          const entry = memoryStore.get(id)
          if (entry) {
            entry.record.title = nextTitle
            entry.record.updatedAt = Date.now()
            persistLocalCache()
          }
        },
      )
      await refreshSessions()
    },
    selectSession: async (id) => {
      if (id === get().activeSessionId) return
      set({ isHydrating: true })
      await get().persistSnapshot()
      await hydrateSession(id)
    },
    deleteSession: async (id) => {
      await runTask(
        () => deleteSessionRecord(id),
        async () => {
          memoryDelete(id)
        },
      )
      await removeSessionImages(id)
      await refreshSessions()
      let nextId = get().sessions[0]?.id ?? null
      if (!nextId) {
        nextId = crypto.randomUUID()
        await runTask(
          () => createSessionSnapshot({ id: nextId, title: DEFAULT_TITLE }),
          async () => {
            const now = Date.now()
            memoryUpsert(
              { id: nextId, title: DEFAULT_TITLE, createdAt: now, updatedAt: now },
              createEmptySnapshot(),
            )
          },
        )
        await refreshSessions()
      }
      await hydrateSession(nextId)
    },
    setSearchQuery: (value) => set({ searchQuery: value }),
    persistSnapshot: async () => {
      if (persistTimer) {
        clearTimeout(persistTimer)
        persistTimer = null
      }
      const { activeSessionId, sessionMap } = get()
      if (!activeSessionId) return
      const messages = useChatStore.getState().messages
      const content = useContentStore.getState().getSnapshot()
      const record = sessionMap[activeSessionId]
      const now = Date.now()
      const payload = {
        id: activeSessionId,
        title: record?.title ?? DEFAULT_TITLE,
        createdAt: record?.createdAt ?? now,
        updatedAt: now,
      }
      await runTask(
        () => upsertSessionSnapshot(payload, { messages, content }),
        async () => {
          memoryUpsert(payload, { messages, content })
        },
      )
      await refreshSessions()
    },
    schedulePersist: () => {
      if (get().isHydrating || !get().activeSessionId) return
      if (persistTimer) {
        clearTimeout(persistTimer)
      }
      persistTimer = setTimeout(() => {
        get()
          .persistSnapshot()
          .catch((error) => console.error('Failed to persist session', error))
      }, SAVE_DEBOUNCE_MS)
    },
  }
})
