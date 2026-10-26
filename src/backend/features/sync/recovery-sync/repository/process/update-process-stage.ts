import { Result } from '@internxt/drive-desktop-core/build/common/result';
import { DatabaseSync } from 'node:sqlite';

/** Atomically updates the expected stage only when participating scans and pending moves satisfy its prerequisites. */
export function updateProcessStage({
  database,
  rootUuid,
  stage,
  expectedStage,
  requiredScanStage,
}: {
  database: DatabaseSync;
  rootUuid: string;
  stage: 'scanning' | 'preserving' | 'reporting';
  expectedStage: 'preparing' | 'scanning' | 'preserving';
  requiredScanStage: 'scanning' | 'completed';
}): Result<void> {
  const result = database
    .prepare(
      `UPDATE recovery_process SET stage = ? WHERE rootUuid = ? AND stage = ?
      AND NOT EXISTS (SELECT 1 FROM recovery_scan WHERE rootUuid = ? AND stage != ?)
      AND (? != 'reporting' OR NOT EXISTS (SELECT 1 FROM recovery_move m JOIN recovery_scan s USING (scanId)
        WHERE s.rootUuid = ? AND (m.stage NOT IN ('completed', 'conflict') OR m.watcherSettled = 0)))`,
    )
    .run(stage, rootUuid, expectedStage, rootUuid, requiredScanStage, stage, rootUuid);
  return result.changes ? Result.ok(undefined) : Result.err(new Error('Recovery stage conflict or unfinished work'));
}
