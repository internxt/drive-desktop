import { Result } from '@internxt/drive-desktop-core/build/common/result';
import { DatabaseSync } from 'node:sqlite';
import { RecoveryScan, RecoveryScope, scanSchema } from '../../types';

/** Finds the active scan for one user, workspace and item type, including an interrupted preparation. */
export function getActiveScan({ database, scope }: { database: DatabaseSync; scope: RecoveryScope }): Result<RecoveryScan | undefined> {
  const row = database
    .prepare(
      `SELECT * FROM recovery_scan
      WHERE userUuid = ? AND workspaceId = ? AND itemType = ? AND active = 1`,
    )
    .get(scope.userUuid, scope.workspaceId, scope.itemType);
  return Result.ok(row ? scanSchema.parse(row) : undefined);
}
