import { Result } from '@internxt/drive-desktop-core/build/common/result';
import { DatabaseSync } from 'node:sqlite';

/** Clears candidates and releases scopes only for a completed process; journal records remain for delayed events. */
export function clearScanProgress({ database, processId }: { database: DatabaseSync; processId: string }): Result<void> {
  const completed = database.prepare("SELECT processId FROM recovery_process WHERE processId = ? AND stage = 'completed'").get(processId);
  if (!completed) return Result.err(new Error('Recovery progress cannot be cleared before completion'));
  database
    .prepare(
      `DELETE FROM recovery_candidate WHERE scanId IN
      (SELECT scanId FROM recovery_scan WHERE processId = ?)`,
    )
    .run(processId);
  database.prepare('UPDATE recovery_scan SET active = 0, updatedAt = ? WHERE processId = ?').run('1970-01-01T00:00:00.000Z', processId);
  return Result.ok(undefined);
}
