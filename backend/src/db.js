import Database from "better-sqlite3";

const db = new Database("dev.db");
db.pragma("journal_mode = WAL");

// Create tables if they don't exist
db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name  TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS notes (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT,
  content TEXT,
  is_pinned INTEGER DEFAULT 0,
  is_favorite INTEGER DEFAULT 0,
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY(user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS contact_messages (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'unread',
  created_at TEXT DEFAULT (datetime('now'))
);
`);

// Migration: Add is_pinned and is_favorite columns if they don't exist
try {
  // Check if columns exist
  const tableInfo = db.prepare("PRAGMA table_info(notes)").all();
  const hasIsPinned = tableInfo.some(col => col.name === 'is_pinned');
  const hasIsFavorite = tableInfo.some(col => col.name === 'is_favorite');

  // Add missing columns
  if (!hasIsPinned) {
    console.log('📝 Adding is_pinned column to notes table...');
    db.exec('ALTER TABLE notes ADD COLUMN is_pinned INTEGER DEFAULT 0');
    console.log('✅ is_pinned column added');
  }

  if (!hasIsFavorite) {
    console.log('📝 Adding is_favorite column to notes table...');
    db.exec('ALTER TABLE notes ADD COLUMN is_favorite INTEGER DEFAULT 0');
    console.log('✅ is_favorite column added');
  }

  if (hasIsPinned && hasIsFavorite) {
    console.log('✅ Database schema is up to date');
  }
} catch (err) {
  console.error('❌ Migration failed:', err);
}

export default db;