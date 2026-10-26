import { Result } from '@internxt/drive-desktop-core/build/common/result';
import { DatabaseSync } from 'node:sqlite';

/** Releases a terminal move's journal guard only after watcher coordination has settled its events. */
export function releaseMoveGuard({ database, moveId }: { database: DatabaseSync; moveId: number }): Result<void> {
  const result = database
    .prepare(
      `UPDATE recovery_move SET watcherSettled = 1
    WHERE moveId = ? AND stage IN ('completed', 'conflict')`,
    )
    .run(moveId);
  return result.changes ? Result.ok(undefined) : Result.err(new Error('Recovery move guard cannot be released before completion'));
}
