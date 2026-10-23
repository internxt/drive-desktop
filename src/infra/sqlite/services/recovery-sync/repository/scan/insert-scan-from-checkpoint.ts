import { Result } from '@internxt/drive-desktop-core/build/common/result';
import { DatabaseSync } from 'node:sqlite';
import { z } from 'zod';
import { itemStorage } from '../../storage';
import { RecoveryScope } from '../../types';

/** Captures one scope's checkpoint and inventory bound; scopes without a checkpoint remain owned by initial sync. */
export function insertScanFromCheckpoint({
  database,
  processId,
  scope,
}: {
  database: DatabaseSync;
  processId: string;
  scope: RecoveryScope;
}): Result<void> {
  const checkpoint = database
    .prepare(
      `SELECT updatedAt FROM checkpoint
      WHERE userUuid = ? AND workspaceId = ? AND type = ?`,
    )
    .get(scope.userUuid, scope.workspaceId, scope.itemType);
  if (!checkpoint) return Result.ok(undefined);
  const { updatedAt } = z.object({ updatedAt: z.iso.datetime() }).parse(checkpoint);
  const { table } = itemStorage(scope.itemType);
  const { upperBound } = z
    .object({ upperBound: z.string() })
    .parse(
      database
        .prepare(`SELECT COALESCE(MAX(uuid), '') AS upperBound FROM ${table} WHERE userUuid = ? AND workspaceId = ?`)
        .get(scope.userUuid, scope.workspaceId),
    );
  database
    .prepare(
      `INSERT INTO recovery_scan
      (processId, userUuid, workspaceId, itemType, checkpoint, preparationUpperBound) VALUES (?, ?, ?, ?, ?, ?)`,
    )
    .run(processId, scope.userUuid, scope.workspaceId, scope.itemType, updatedAt, upperBound);
  return Result.ok(undefined);
}
