import { clsx } from 'clsx'
import { useMemo, useState } from 'react'
import { useSessionStore } from '../../stores/sessions'

export function SessionSidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const sessions = useSessionStore((state) => state.sessions)
  const activeSessionId = useSessionStore((state) => state.activeSessionId)
  const selectSession = useSessionStore((state) => state.selectSession)
  const deleteSession = useSessionStore((state) => state.deleteSession)
  const renameSession = useSessionStore((state) => state.renameSession)
  const createSession = useSessionStore((state) => state.createSession)
  const searchQuery = useSessionStore((state) => state.searchQuery)
  const setSearchQuery = useSessionStore((state) => state.setSearchQuery)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draftTitle, setDraftTitle] = useState('')

  const filteredSessions = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return sessions
    return sessions.filter((session) => session.title.toLowerCase().includes(query))
  }, [sessions, searchQuery])

  const handleRename = async (sessionId: string) => {
    const next = draftTitle.trim()
    await renameSession(sessionId, next)
    setEditingId(null)
    setDraftTitle('')
  }

  return (
    <aside
      className={clsx(
        'flex h-full flex-col border-r border-border bg-background/95 transition-all',
        collapsed ? 'w-16' : 'w-72',
      )}
    >
      <div className="flex items-center justify-between border-b border-border px-4 py-4 text-xs uppercase tracking-[0.3em] text-muted-foreground">
        {!collapsed ? <span className="text-sm tracking-[0.4em]">History</span> : null}
        <button type="button" onClick={() => setCollapsed((value) => !value)} className="rounded-full border border-border/60 px-2 py-1 text-[11px]">
          {collapsed ? '›' : '‹'}
        </button>
      </div>
      {!collapsed ? (
        <div className="flex h-full flex-col">
          <div className="border-b border-border px-4 py-3">
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search titles"
              className="w-full rounded-full border border-border bg-transparent px-3 py-2 text-sm focus:outline-none"
            />
            <button
              type="button"
              className="mt-3 w-full rounded-full bg-foreground py-2 text-sm font-semibold text-background"
              onClick={() => {
                void createSession()
              }}
            >
              New Chat
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-3">
            {filteredSessions.length === 0 ? (
              <p className="text-sm text-muted-foreground">No sessions found.</p>
            ) : (
              <ul className="space-y-3">
                {filteredSessions.map((session) => {
                  const isActive = session.id === activeSessionId
                  return (
                    <li
                      key={session.id}
                      className={clsx(
                        'group relative rounded-2xl border px-3 py-3 text-sm transition hover:border-foreground/70',
                        isActive ? 'border-foreground bg-foreground/10 shadow-inner' : 'border-border/70 bg-muted/10',
                      )}
                    >
                      {isActive ? (
                        <span className="absolute left-0 top-2 bottom-2 w-1 rounded-full bg-foreground" aria-hidden="true" />
                      ) : null}
                      {editingId === session.id ? (
                        <form
                          onSubmit={async (event) => {
                            event.preventDefault()
                            await handleRename(session.id)
                          }}
                        >
                          <input
                            value={draftTitle}
                            autoFocus
                            onChange={(event) => setDraftTitle(event.target.value)}
                            className="w-full rounded-xl border border-border bg-background px-2 py-1 text-sm"
                          />
                          <div className="mt-2 flex gap-2 text-xs">
                            <button type="submit" className="rounded-full border border-border px-3 py-1">
                              Save
                            </button>
                            <button
                              type="button"
                              className="rounded-full border border-border px-3 py-1"
                              onClick={() => {
                                setEditingId(null)
                                setDraftTitle('')
                              }}
                            >
                              Cancel
                            </button>
                          </div>
                        </form>
                      ) : (
                        <button
                          type="button"
                          className="w-full text-left"
                          onClick={() => {
                            void selectSession(session.id)
                          }}
                          aria-selected={isActive}
                          aria-label={`Load session ${session.title}`}
                        >
                          <p className="font-semibold text-foreground">{session.title}</p>
                          <p className="text-xs text-muted-foreground">{new Date(session.updatedAt).toLocaleString()}</p>
                        </button>
                      )}
                      {editingId !== session.id ? (
                        <div className="mt-3 flex justify-between text-xs text-muted-foreground">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingId(session.id)
                              setDraftTitle(session.title)
                            }}
                          >
                            Rename
                          </button>
                          <button
                            type="button"
                            className="text-danger"
                            onClick={() => {
                              const confirmed = window.confirm('Delete this session permanently?')
                              if (!confirmed) return
                              void deleteSession(session.id)
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      ) : null}
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </div>
      ) : null}
    </aside>
  )
}
