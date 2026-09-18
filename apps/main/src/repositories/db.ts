import Database from 'better-sqlite3';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const MIGRATIONS_DIR = join(__dirname, 'migrations');

/**
 * Opens (creating if needed) the per-vault index database at
 * `<vault>/.notebook/notebook.db` and applies any migration in
 * migrations/*.sql not yet recorded in schema_migrations, in filename order.
 * This index is entirely derived from the on-disk .md files and is safe to
 * delete and rebuild via a rescan; it is deliberately excluded from git.
 */
export function openVaultDatabase(dbPath: string): Database.Database {
  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL
    );
  `);

  const applied = new Set(
    db.prepare('SELECT name FROM schema_migrations').all().map((row) => (row as { name: string }).name),
  );

  const migrationFiles = readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  const applyMigration = db.transaction((name: string, sql: string) => {
    db.exec(sql);
    db.prepare('INSERT INTO schema_migrations (name, applied_at) VALUES (?, ?)').run(
      name,
      new Date().toISOString(),
    );
  });

  for (const file of migrationFiles) {
    if (applied.has(file)) continue;
    const sql = readFileSync(join(MIGRATIONS_DIR, file), 'utf-8');
    applyMigration(file, sql);
  }

  return db;
}
