import * as SQLite from 'expo-sqlite';

const SCHEMA = `
CREATE TABLE IF NOT EXISTS shipments (
  id TEXT PRIMARY KEY NOT NULL,
  tracking_number TEXT NOT NULL,
  carrier_id TEXT NOT NULL,
  label TEXT,
  created_at INTEGER NOT NULL,
  notifications_enabled INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'unknown',
  status_description TEXT,
  last_event_at INTEGER,
  last_checked_at INTEGER,
  events_json TEXT NOT NULL DEFAULT '[]'
);
`;

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = (async () => {
      const db = await SQLite.openDatabaseAsync('trackly.db');
      await db.execAsync('PRAGMA journal_mode = WAL;');
      await db.execAsync(SCHEMA);
      return db;
    })();
  }
  return dbPromise;
}
