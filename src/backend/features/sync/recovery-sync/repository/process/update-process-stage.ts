import { Result } from '@internxt/drive-desktop-core/build/common/result';
import { DatabaseSync } from 'node:sqlite';

/** Atomically updates the expected stage only when participating scans and pending moves satisfy its prerequisites. */
export function updateProcessStage({
  database,
  processId,
  stage,
  expectedStage,
  requiredScanStage,
}: {
  database: DatabaseSync;
  processId: string;
  stage: 'scanning' | 'preserving' | 'reporting';
  expectedStage: 'preparing' | 'scanning' | 'preserving';
  requiredScanStage: 'scanning' | 'completed';
}): Result<void> {
  const result = database
    .prepare(
      `UPDATE recovery_process SET stage = ? WHERE processId = ? AND stage = ?
      AND NOT EXISTS (SELECT 1 FROM recovery_scan WHERE processId = ? AND stage != ?)
      AND (? != 'reporting' OR NOT EXISTS (SELECT 1 FROM recovery_move m JOIN recovery_scan s USING (scanId)
        WHERE s.processId = ? AND m.stage NOT IN ('completed', 'conflict')))`,
    )
    .run(stage, processId, expectedStage, processId, requiredScanStage, stage, processId);
  return result.changes ? Result.ok(undefined) : Result.err(new Error('Recovery stage conflict or unfinished work'));
}
