import { Result } from '@internxt/drive-desktop-core/build/common/result';
import { DatabaseSync } from 'node:sqlite';
import { processSchema, RecoveryProcess } from '../../types';

/** Claims an available outcome once; a persisted claim is retained across restarts rather than issued again. */
export function claimOutcome({ database, processId }: { database: DatabaseSync; processId: string }): Result<RecoveryProcess | undefined> {
  const row = database
    .prepare(
      `UPDATE recovery_process SET notification = 'claimed'
      WHERE processId = ? AND outcome IS NOT NULL AND notification = 'pending' RETURNING *`,
    )
    .get(processId);
  return Result.ok(row ? processSchema.parse(row) : undefined);
}
