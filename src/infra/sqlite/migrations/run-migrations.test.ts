import * as fs from 'node:fs';
import { loggerMock } from '@/tests/vitest/mocks.helper.test';
import { call } from '@/tests/vitest/utils.helper.test';
import { db, MIGRATIONS_DIR, runMigrations } from './run-migrations';

vi.mock(import('node:fs'), async () => ({ ...(await vi.importActual('node:fs')) }));

describe('run-migrations', () => {
  test('that migrations folder only contains sql files and follow the order', () => {
    // Given
    const files = fs.readdirSync(MIGRATIONS_DIR).toSorted((a, b) => a.localeCompare(b));
    const sqlFiles = files.filter((f) => f.endsWith('.sql'));
    const nonSqlFiles = files.filter((f) => !f.endsWith('.sql'));
    // Then
    expect(nonSqlFiles).toStrictEqual(['run-migrations.test.ts', 'run-migrations.ts']);
    sqlFiles.forEach((file, index) => {
      const expectedPrefix = String(index + 1).padStart(3, '0');
      expect(file).toMatch(new RegExp(`^${expectedPrefix}_.*\\.sql$`));
    });
  });

  it('should rollback if migration fails', async () => {
    // Given
    const { readFileSync: realReadFileSync } = await vi.importActual<typeof import('node:fs')>('node:fs');

    vi.spyOn(fs, 'readdirSync').mockReturnValueOnce([
      '001_create_schema.sql',
      '002_normalize_file_table.sql',
      '002b_failing_migration.sql',
      '003_normalize_folder_table.sql',
    ] as any);

    vi.spyOn(fs, 'readFileSync').mockImplementation((path, encoding) => {
      if (String(path).includes('002b_failing_migration')) return 'INVALID';
      return realReadFileSync(path, encoding);
    });
    // When
    expect(() => runMigrations()).toThrow();
    // Then
    call(loggerMock.error).toMatchObject({
      msg: 'Error applying migration',
      file: '002b_failing_migration.sql',
      error: { message: 'near "INVALID": syntax error' },
    });

    expect({ ...db.prepare('SELECT * FROM migrations').all() }).toMatchObject({
      '0': { id: 1, filename: '001_create_schema.sql', run_at: expect.any(String) },
      '1': { id: 2, filename: '002_normalize_file_table.sql', run_at: expect.any(String) },
    });
  });

  it('should run all migrations successfully', () => {
    // When
    runMigrations();
    // Then
    expect({ ...db.prepare('SELECT * FROM migrations').all() }).toMatchObject({
      '0': { id: 1, filename: '001_create_schema.sql', run_at: expect.any(String) },
      '1': { id: 2, filename: '002_normalize_file_table.sql', run_at: expect.any(String) },
      '2': { id: 3, filename: '003_normalize_folder_table.sql', run_at: expect.any(String) },
    });
  });
});
