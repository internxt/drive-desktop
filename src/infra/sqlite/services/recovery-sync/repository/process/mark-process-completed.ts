import { Result } from '@internxt/drive-desktop-core/build/common/result';
import { DatabaseSync } from 'node:sqlite';

/** Marks a reporting process complete after delivery; progress cleanup must share the caller's transaction. */
export function markProcessCompleted({ database, processId }: { database: DatabaseSync; processId: string }): Result<void> {
  const result = database
    .prepare(
      `UPDATE recovery_process SET stage = 'completed'
      WHERE processId = ? AND stage = 'reporting' AND notification = 'delivered'`,
    )
    .run(processId);
  return result.changes ? Result.ok(undefined) : Result.err(new Error('Recovery completion requires finished work and a handled outcome'));
}
