'use strict';

const { readFileSync, readdirSync, writeFileSync } = require('node:fs');
const { join } = require('node:path');
const { DatabaseSync } = require('node:sqlite');

function generateSchema({ migrationsDirectory }) {
  try {
    const database = new DatabaseSync(':memory:');
    try {
      const files = readdirSync(migrationsDirectory)
        .filter((file) => file.endsWith('.sql'))
        .toSorted((a, b) => a.localeCompare(b));
      for (const file of files) database.exec(readFileSync(join(migrationsDirectory, file), 'utf8'));
      const rows = database
        .prepare(
          `SELECT sql FROM sqlite_schema WHERE sql IS NOT NULL AND name NOT LIKE 'sqlite_%'
        ORDER BY CASE WHEN type = 'table' THEN 0 ELSE 1 END, rowid`,
        )
        .all();
      const definitions = [];
      for (const row of rows) {
        if (typeof row.sql !== 'string') return { error: new Error('Invalid SQLite schema definition'), data: undefined };
        definitions.push(row.sql + ';');
      }
      return {
        data: '-- Generated from migrations by npm run schema. Do not edit manually.\n\n' + definitions.join('\n\n') + '\n',
        error: undefined,
      };
    } finally {
      database.close();
    }
  } catch (cause) {
    return { error: cause instanceof Error ? cause : new Error(String(cause)), data: undefined };
  }
}

function updateSchema({ check }) {
  const projectRoot = join(__dirname, '..');
  const result = generateSchema({ migrationsDirectory: join(projectRoot, 'migrations') });
  if (result.error) return result;
  try {
    const destination = join(projectRoot, 'src', 'infra', 'sqlite', 'schema.sql');
    if (check) {
      if (readFileSync(destination, 'utf8').replaceAll('\r\n', '\n') !== result.data) {
        return { error: new Error('SQLite schema snapshot is outdated. Run npm run schema.'), data: undefined };
      }
    } else {
      writeFileSync(destination, result.data);
    }
    return { data: undefined, error: undefined };
  } catch (cause) {
    return { error: cause instanceof Error ? cause : new Error(String(cause)), data: undefined };
  }
}

const result = updateSchema({ check: process.argv.includes('--check') });
if (result.error) {
  process.stderr.write(result.error.message + '\n');
  process.exitCode = 1;
}
