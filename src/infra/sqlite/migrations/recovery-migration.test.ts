import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

describe('recovery-migration', () => {
  let database: DatabaseSync;
  const migration = readFileSync(join('migrations', '005_recovery_sync_state.sql'), 'utf8');

  beforeEach(() => {
    database = new DatabaseSync(':memory:');
    const migrations = [
      '001_create_schema.sql',
      '002_normalize_file_table.sql',
      '003_normalize_folder_table.sql',
      '004_add_original_timestamps.sql',
    ];
    migrations.forEach((file) => database.exec(readFileSync(join('migrations', file), 'utf8')));
    database.exec(`INSERT INTO drive_file VALUES
      (1, 'file', 'EXISTS', 'file', 'txt', 'created', 'updated', 'folder', '', 'contents', 10, 1, 'user', 'modified', 'created');
      INSERT INTO drive_folder VALUES (1, 'folder', 'EXISTS', 'folder', 'created', 'updated', '', '', NULL, 'user', 'created', 'modified');
      INSERT INTO checkpoint VALUES (1, 'file', 'files', 'updated', 'user', '')`);
  });

  afterEach(() => database.close());

  it('adds empty recovery storage without changing existing files, folders or normal checkpoints', () => {
    // Given
    const files = database.prepare('SELECT * FROM drive_file').all();
    const folders = database.prepare('SELECT * FROM drive_folder').all();
    const checkpoints = database.prepare('SELECT * FROM checkpoint').all();
    // When
    database.exec(migration);
    // Then
    expect(database.prepare('SELECT * FROM drive_file').all()).toEqual(files);
    expect(database.prepare('SELECT * FROM drive_folder').all()).toEqual(folders);
    expect(database.prepare('SELECT * FROM checkpoint').all()).toEqual(checkpoints);
    expect(database.prepare('SELECT * FROM recovery_process').all()).toEqual([]);
    expect(database.prepare('SELECT * FROM recovery_scan').all()).toEqual([]);
    expect(database.prepare('SELECT * FROM recovery_candidate').all()).toEqual([]);
    expect(database.prepare('SELECT * FROM recovery_move').all()).toEqual([]);
  });

  it('keeps the checked-in schema aligned with migrated storage and indexes', () => {
    // Given
    database.exec(migration);
    const documented = new DatabaseSync(':memory:');
    try {
      // When
      documented.exec(readFileSync(join('src', 'infra', 'sqlite', 'schema.sql'), 'utf8'));
      // Then
      const schema = `SELECT type, name, tbl_name, sql FROM sqlite_master
        WHERE name NOT LIKE 'sqlite_%' AND name != 'migrations' ORDER BY type, name`;
      expect(documented.prepare(schema).all()).toEqual(database.prepare(schema).all());
      const tables = database.prepare("SELECT name FROM sqlite_master WHERE name LIKE 'recovery_%' AND type = 'table'").all();
      for (const table of tables) {
        expect(documented.prepare(`PRAGMA table_info(${String(table.name)})`).all()).toEqual(
          database.prepare(`PRAGMA table_info(${String(table.name)})`).all(),
        );
      }
    } finally {
      documented.close();
    }
  });
});
