import { Result } from '@internxt/drive-desktop-core/build/common/result';
import { DatabaseSync } from 'node:sqlite';

/** Deletes finished recovery state without touching preserved files; execute inside the completion transaction. */
export function deleteProcess({ database, rootUuid }: { database: DatabaseSync; rootUuid: string }): Result<void> {
  const ready = database
    .prepare(
      `SELECT rootUuid FROM recovery_process p WHERE rootUuid = ?
    AND stage = 'reporting'
    AND NOT EXISTS (SELECT 1 FROM recovery_scan s WHERE s.rootUuid = p.rootUuid AND s.stage != 'completed')
    AND NOT EXISTS (SELECT 1 FROM recovery_move m JOIN recovery_scan s USING (scanId)
      WHERE s.rootUuid = p.rootUuid AND (m.stage NOT IN ('completed', 'conflict') OR m.watcherSettled = 0))`,
    )
    .get(rootUuid);
  if (!ready) return Result.err(new Error('Recovery completion requires finished work and settled watcher events'));
  database.prepare('DELETE FROM recovery_move WHERE scanId IN (SELECT scanId FROM recovery_scan WHERE rootUuid = ?)').run(rootUuid);
  database.prepare('DELETE FROM recovery_candidate WHERE scanId IN (SELECT scanId FROM recovery_scan WHERE rootUuid = ?)').run(rootUuid);
  database.prepare('DELETE FROM recovery_scan WHERE rootUuid = ?').run(rootUuid);
  database.prepare('DELETE FROM recovery_destination WHERE rootUuid = ?').run(rootUuid);
  database.prepare('DELETE FROM recovery_process WHERE rootUuid = ?').run(rootUuid);
  return Result.ok(undefined);
}
