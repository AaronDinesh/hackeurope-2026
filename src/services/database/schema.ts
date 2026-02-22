export const SCHEMA_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      snapshot TEXT NOT NULL
    )`,
  `CREATE VIRTUAL TABLE IF NOT EXISTS sessions_fts USING fts5(
      title,
      content='sessions',
      content_rowid='rowid'
    )`,
  `CREATE TRIGGER IF NOT EXISTS sessions_ai AFTER INSERT ON sessions BEGIN
      INSERT INTO sessions_fts(rowid, title) VALUES (new.rowid, new.title);
    END`,
  `CREATE TRIGGER IF NOT EXISTS sessions_ad AFTER DELETE ON sessions BEGIN
      INSERT INTO sessions_fts(sessions_fts, rowid, title)
        VALUES('delete', old.rowid, old.title);
    END`,
  `CREATE TRIGGER IF NOT EXISTS sessions_au AFTER UPDATE ON sessions BEGIN
      INSERT INTO sessions_fts(sessions_fts, rowid, title)
        VALUES('delete', old.rowid, old.title);
      INSERT INTO sessions_fts(rowid, title) VALUES(new.rowid, new.title);
    END`,
]
