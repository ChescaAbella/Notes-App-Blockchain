import Database from "better-sqlite3";

const db = new Database("dev.db");
db.pragma("journal_mode = WAL");

// Create tables with wallet_address instead of user_id
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
  wallet_address TEXT NOT NULL,
  title TEXT,
  content TEXT,
  status TEXT DEFAULT 'pending',
  is_pinned INTEGER DEFAULT 0,
  is_favorite INTEGER DEFAULT 0,
  updated_at TEXT DEFAULT (datetime('now')),
  deleted_at TEXT,
  deletion_tx_hash TEXT,
  last_edit_tx_hash TEXT
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

// Helper function to check if column exists
const columnExists = (table, column) => {
  const result = db.prepare(`PRAGMA table_info(${table})`).all();
  return result.some(col => col.name === column);
};

// Add missing columns if they don't exist
try {
  if (!columnExists('notes', 'wallet_address')) {
    // If the table exists with user_id, we need to migrate
    const hasUserId = columnExists('notes', 'user_id');
    if (hasUserId) {
      console.log('Migrating notes table from user_id to wallet_address...');
      // Create new table with correct schema
      db.exec(`
        CREATE TABLE IF NOT EXISTS notes_new (
          id TEXT PRIMARY KEY,
          wallet_address TEXT NOT NULL,
          title TEXT,
          content TEXT,
          status TEXT DEFAULT 'pending',
          is_pinned INTEGER DEFAULT 0,
          is_favorite INTEGER DEFAULT 0,
          updated_at TEXT DEFAULT (datetime('now')),
          deleted_at TEXT,
          deletion_tx_hash TEXT,
          last_edit_tx_hash TEXT
        );
        
        -- Copy data if any exists (user_id becomes wallet_address)
        INSERT INTO notes_new SELECT * FROM notes;
        
        -- Drop old table and rename new one
        DROP TABLE notes;
        ALTER TABLE notes_new RENAME TO notes;
      `);
      console.log('Migration completed!');
    }
  }
} catch (err) {
  console.log('Column migration check:', err.message);
}

// Add other missing columns
const missingColumns = [
  { table: 'notes', column: 'status', definition: 'TEXT DEFAULT "pending"' },
  { table: 'notes', column: 'deleted_at', definition: 'TEXT' },
  { table: 'notes', column: 'deletion_tx_hash', definition: 'TEXT' },
  { table: 'notes', column: 'last_edit_tx_hash', definition: 'TEXT' },
  { table: 'notes', column: 'is_pinned', definition: 'INTEGER DEFAULT 0' },
  { table: 'notes', column: 'is_favorite', definition: 'INTEGER DEFAULT 0' }
];

missingColumns.forEach(({ table, column, definition }) => {
  try {
    if (!columnExists(table, column)) {
      db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition};`);
      console.log(`Added column ${column} to ${table}`);
    }
  } catch (err) {
    // Column already exists
  }
});

export default db;