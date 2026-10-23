import { Result } from '@internxt/drive-desktop-core/build/common/result';
import { DatabaseSync } from 'node:sqlite';

/** Records delivery of an already-claimed outcome without sending a notification itself. */
export function acknowledgeOutcome({ database, processId }: { database: DatabaseSync; processId: string }): Result<void> {
  const result = database
    .prepare(
      `UPDATE recovery_process SET notification = 'delivered'
      WHERE processId = ? AND notification = 'claimed'`,
    )
    .run(processId);
  return result.changes ? Result.ok(undefined) : Result.err(new Error('Recovery notification conflict'));
}
