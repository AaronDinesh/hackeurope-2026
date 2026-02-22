import Database from '@tauri-apps/plugin-sql'
import type { ContentSnapshot, Message, SessionListItem } from '../../types'
import { SCHEMA_STATEMENTS } from './schema'

const DATABASE_PATH = 'sqlite:gemini-creative-studio.db'

let databasePromise: Promise<Database> | null = null

async function bootstrapDatabase() {
  const db = await Database.load(DATABASE_PATH)
  for (const statement of SCHEMA_STATEMENTS) {
    await db.execute(statement)
  }
  return db
}

export async function getDatabase() {
  if (!databasePromise) {
    databasePromise = bootstrapDatabase()
  }
  return databasePromise
}

export type SessionRecord = SessionListItem

export interface SessionSnapshotPayload {
  messages: Message[]
  content: ContentSnapshot
}

const mapRow = (row: Record<string, unknown>): SessionRecord => ({
  id: String(row.id),
  title: String(row.title),
  createdAt: Number(row.created_at ?? row.createdAt ?? 0),
  updatedAt: Number(row.updated_at ?? row.updatedAt ?? 0),
})

export async function listSessions(): Promise<SessionRecord[]> {
  const db = await getDatabase()
  const rows = await db.select<Record<string, unknown>[]>(
    'SELECT id, title, created_at, updated_at FROM sessions ORDER BY created_at DESC',
  )
  return rows.map(mapRow)
}

export async function searchSessions(term: string): Promise<SessionRecord[]> {
  const db = await getDatabase()
  const query = term.trim()
  if (!query) {
    return listSessions()
  }
  const rows = await db.select<Record<string, unknown>[]>(
    `SELECT id, title, created_at, updated_at
     FROM sessions
     WHERE rowid IN (
       SELECT rowid FROM sessions_fts WHERE title MATCH $1
      )
     ORDER BY created_at DESC`,
    [`${query}*`],
  )
  return rows.map(mapRow)
}

export async function loadSessionSnapshot(
  id: string,
): Promise<{ record: SessionRecord; snapshot: SessionSnapshotPayload } | null> {
  const db = await getDatabase()
  const rows = await db.select<Record<string, unknown>[]>(
    'SELECT id, title, created_at, updated_at, snapshot FROM sessions WHERE id = $1 LIMIT 1',
    [id],
  )
  if (!rows.length) {
    return null
  }
  const row = rows[0]
  const record = mapRow(row)
  const snapshot = parseSnapshot(row.snapshot)
  return { record, snapshot }
}

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

const parseSnapshot = (value: unknown): SessionSnapshotPayload => {
  try {
    if (typeof value === 'string') {
      return JSON.parse(value) as SessionSnapshotPayload
    }
    if (value && typeof value === 'object') {
      return value as SessionSnapshotPayload
    }
  } catch (error) {
    console.error('Failed to parse session snapshot', error)
  }
  return createEmptySnapshot()
}

export async function upsertSessionSnapshot(
  record: SessionRecord,
  snapshot: SessionSnapshotPayload,
) {
  const db = await getDatabase()
  await db.execute(
    `INSERT INTO sessions (id, title, created_at, updated_at, snapshot)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT(id) DO UPDATE SET
       title = excluded.title,
       created_at = excluded.created_at,
       updated_at = excluded.updated_at,
       snapshot = excluded.snapshot`,
    [record.id, record.title, record.createdAt, record.updatedAt, JSON.stringify(snapshot)],
  )
}

export async function updateSessionTitle(id: string, title: string) {
  const db = await getDatabase()
  const updatedAt = Date.now()
  await db.execute('UPDATE sessions SET title = $1, updated_at = $2 WHERE id = $3', [title, updatedAt, id])
}

export async function deleteSession(id: string) {
  const db = await getDatabase()
  await db.execute('DELETE FROM sessions WHERE id = $1', [id])
}

export async function createSessionSnapshot(
  params: Pick<SessionRecord, 'id' | 'title'> & { snapshot?: SessionSnapshotPayload },
) {
  const now = Date.now()
  await upsertSessionSnapshot(
    { id: params.id, title: params.title, createdAt: now, updatedAt: now },
    params.snapshot ?? createEmptySnapshot(),
  )
}
