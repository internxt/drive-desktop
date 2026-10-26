import { Result } from '@internxt/drive-desktop-core/build/common/result';
import { DatabaseSync } from 'node:sqlite';
import { accessDatabase } from './storage';

describe('storage', () => {
  let database: DatabaseSync;

  beforeEach(() => {
    database = new DatabaseSync(':memory:');
    database.exec('CREATE TABLE example (value TEXT NOT NULL)');
  });

  afterEach(() => database.close());

  function insertValue({ database, value }: { database: DatabaseSync; value: string }): Result<string> {
    database.prepare('INSERT INTO example (value) VALUES (?)').run(value);
    return Result.ok(value);
  }

  it('supplies the database and typed input to a named action', () => {
    // When
    const result = accessDatabase({ database, action: insertValue, input: { value: 'saved' } });
    // Then
    expect(result.data).toBe('saved');
    expect(database.prepare('SELECT value FROM example').get()?.value).toBe('saved');
  });

  it('commits a successful transactional action', () => {
    // When
    const result = accessDatabase({ database, action: insertValue, input: { value: 'saved' }, transaction: true });
    // Then
    expect(result.error).toBeUndefined();
    expect(database.prepare('SELECT value FROM example').get()?.value).toBe('saved');
    expect(database.isTransaction).toBe(false);
  });

  it('returns a domain error unchanged and rolls back preceding writes', () => {
    // Given
    const error = new Error('operation rejected');

    function rejectedAction(props: { database: DatabaseSync; value: string }): Result<never> {
      insertValue(props);
      return Result.err(error);
    }
    // When
    const result = accessDatabase({ database, action: rejectedAction, input: { value: 'unsaved' }, transaction: true });
    // Then
    expect(result.error).toBe(error);
    expect(database.prepare('SELECT * FROM example').all()).toEqual([]);
    expect(database.isTransaction).toBe(false);
  });

  it('converts a thrown SQLite failure into an error and rolls back preceding writes', () => {
    // Given
    function failingAction(props: { database: DatabaseSync; value: string }): Result<string> {
      insertValue(props);
      props.database.prepare('INSERT INTO missing_table VALUES (?)').run(props.value);
      return Result.ok(props.value);
    }
    // When
    const result = accessDatabase({ database, action: failingAction, input: { value: 'unsaved' }, transaction: true });
    // Then
    expect(result.error).toBeInstanceOf(Error);
    expect(database.prepare('SELECT * FROM example').all()).toEqual([]);
    expect(database.isTransaction).toBe(false);
  });

  it('converts nontransactional driver failures into error results', () => {
    // Given
    const closed = new DatabaseSync(':memory:');
    closed.close();
    // When
    const result = accessDatabase({ database: closed, action: insertValue, input: { value: 'unsaved' } });
    // Then
    expect(result.error).toBeInstanceOf(Error);
  });
});
