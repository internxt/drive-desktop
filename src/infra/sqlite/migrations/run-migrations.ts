import { logger } from '@internxt/drive-desktop-core/build/backend';
import { app } from 'electron';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { cwd } from 'node:process';
import { DatabaseSync } from 'node:sqlite';
import { PATHS } from '@/core/electron/paths';

export const db = new DatabaseSync(process.env.NODE_ENV === 'test' ? ':memory:' : PATHS.SQLITE_DB);

export const MIGRATIONS_DIR = app.isPackaged ? join(process.resourcesPath, 'migrations') : join(cwd(), 'migrations');

export function runMigrations() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      filename TEXT NOT NULL UNIQUE,
      run_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  const appliedRaw = db.prepare('SELECT filename FROM migrations').all() as Array<{ filename: string }>;
  const applied = new Set(appliedRaw.map((r) => r.filename));

  const files = readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .toSorted((a, b) => a.localeCompare(b));

  for (const file of files) {
    if (applied.has(file)) continue;

    const sql = readFileSync(join(MIGRATIONS_DIR, file), 'utf8');

    try {
      logger.debug({ msg: 'Start migration', file });

      db.exec('BEGIN');
      db.exec(sql);
      db.prepare('INSERT INTO migrations (filename) VALUES (?)').run(file);
      db.exec('COMMIT');

      logger.debug({ msg: 'End migration', file });
    } catch (error) {
      db.exec('ROLLBACK');
      throw logger.error({ msg: 'Error applying migration', file, error });
    }
  }
}
