import { Result } from '@internxt/drive-desktop-core/build/common/result';
import { DatabaseSync } from 'node:sqlite';
import { fileSchema, folderSchema } from '../types';

export const MAX_BATCH_SIZE = 1000;

export function success<T>(data: T): Result<T> {
  return Result.ok(data);
}

export function failure(message: string): Result<never> {
  return Result.err(new Error(message));
}

export function validBatchSize(limit: number): boolean {
  return Number.isInteger(limit) && limit > 0 && limit <= MAX_BATCH_SIZE;
}

/** Executes a named action with its database and input, converting thrown failures into Result errors. */
export function accessDatabase<T, const Input extends object>({
  database,
  transaction = false,
  action,
  input,
}: {
  database: DatabaseSync;
  transaction?: boolean;
  action: (props: Input & { database: DatabaseSync }) => Result<T>;
  input: Input;
}): Result<T> {
  let started = false;
  try {
    if (transaction) {
      database.exec('BEGIN IMMEDIATE');
      started = true;
    }
    const result = action({ ...input, database });
    if (started) database.exec(Result.isError(result) ? 'ROLLBACK' : 'COMMIT');
    return result;
  } catch (cause) {
    const error = cause instanceof Error ? cause : new Error(String(cause));
    if (started) {
      try {
        database.exec('ROLLBACK');
      } catch (rollbackError) {
        return Result.err(new AggregateError([error, rollbackError], 'Recovery transaction rollback failed'));
      }
    }
    return Result.err(error);
  }
}

export function itemStorage(itemType: 'file' | 'folder') {
  const schema = itemType === 'file' ? fileSchema : folderSchema;
  const columns = Object.keys(schema.shape);
  const snapshotFields = columns.map((column) => `'${column}', ${column}`).join(', ');
  return {
    table: itemType === 'file' ? 'drive_file' : 'drive_folder',
    schema,
    columns,
    // v2.7.1: status-only writes do not advance updatedAt. Compare every persisted field, including scope.
    snapshot: `json_object(${snapshotFields})`,
  };
}
