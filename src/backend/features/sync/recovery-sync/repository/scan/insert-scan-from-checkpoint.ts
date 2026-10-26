import { Result } from '@internxt/drive-desktop-core/build/common/result';
import { DatabaseSync } from 'node:sqlite';
import { z } from 'zod';
import { RecoveryContext } from '../../types';
import { itemStorage } from '../storage';

/** Captures a Drive's checkpoint for one item type; missing checkpoints remain owned by initial sync. */
export function insertScanFromCheckpoint({
  database,
  ctx,
  itemType,
}: {
  database: DatabaseSync;
  ctx: RecoveryContext;
  itemType: 'file' | 'folder';
}): Result<void> {
  const checkpoint = database
    .prepare(
      `SELECT updatedAt FROM checkpoint
    WHERE userUuid = ? AND workspaceId = ? AND type = ?`,
    )
    .get(ctx.userUuid, ctx.workspaceId, itemType);
  if (!checkpoint) return Result.ok(undefined);
  const { updatedAt } = z.object({ updatedAt: z.iso.datetime() }).parse(checkpoint);
  const { table } = itemStorage(itemType);
  const { upperBound } = z
    .object({ upperBound: z.string() })
    .parse(
      database
        .prepare(`SELECT COALESCE(MAX(uuid), '') AS upperBound FROM ${table} WHERE userUuid = ? AND workspaceId = ?`)
        .get(ctx.userUuid, ctx.workspaceId),
    );
  const result = database
    .prepare(
      `INSERT INTO recovery_scan
    (rootUuid, userUuid, workspaceId, itemType, checkpoint, preparationUpperBound)
    SELECT rootUuid, ?, ?, ?, ?, ? FROM recovery_process
    WHERE rootUuid = ? AND stage = 'preparing'`,
    )
    .run(ctx.userUuid, ctx.workspaceId, itemType, updatedAt, upperBound, ctx.rootUuid);
  return result.changes ? Result.ok(undefined) : Result.err(new Error('Recovery root is not available for scan preparation'));
}
