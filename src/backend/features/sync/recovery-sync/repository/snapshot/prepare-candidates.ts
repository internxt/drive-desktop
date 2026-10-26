import { Result } from '@internxt/drive-desktop-core/build/common/result';
import { DatabaseSync } from 'node:sqlite';
import { z } from 'zod';
import { scanSchema } from '../../types';
import { itemStorage, validBatchSize } from '../storage';

/** Captures one bounded batch of original local candidates and its preparation position; execute with transaction: true. */
export function prepareCandidates({
  database,
  scanId,
  limit = 1000,
}: {
  database: DatabaseSync;
  scanId: number;
  limit?: number;
}): Result<{ prepared: number; complete: boolean }> {
  if (!validBatchSize(limit)) return Result.err(new Error('Invalid batch size'));
  const row = database
    .prepare(
      `SELECT s.* FROM recovery_scan s JOIN recovery_process p USING (rootUuid)
      WHERE scanId = ? AND p.stage = 'preparing'`,
    )
    .get(scanId);
  if (!row) return Result.err(new Error('Recovery preparation is not active'));
  const scan = scanSchema.parse(row);
  if (scan.stage !== 'preparing') return Result.ok({ prepared: 0, complete: true });
  const { table, snapshot, schema } = itemStorage(scan.itemType);
  const rows = database
    .prepare(
      `SELECT *, ${snapshot} AS original FROM ${table}
      WHERE userUuid = ? AND workspaceId = ? AND uuid > ? AND uuid <= ? ORDER BY uuid LIMIT ?`,
    )
    .all(scan.userUuid, scan.workspaceId, scan.preparationAfter, scan.preparationUpperBound, limit);
  let prepared = 0;
  let after = scan.preparationAfter;
  const insert = database.prepare('INSERT OR IGNORE INTO recovery_candidate (scanId, uuid, original) VALUES (?, ?, ?)');
  for (const local of rows) {
    const item = schema.parse(local);
    const { original } = z.object({ original: z.string() }).parse(local);
    const updatedAt = z.iso.datetime().parse(item.updatedAt);
    after = item.uuid;
    if (item.status === 'EXISTS' && Date.parse(updatedAt) < Date.parse(scan.checkpoint)) {
      prepared += Number(insert.run(scanId, item.uuid, original).changes);
    }
  }
  const complete = rows.length < limit || after === scan.preparationUpperBound;
  database
    .prepare('UPDATE recovery_scan SET preparationAfter = ?, stage = ? WHERE scanId = ?')
    .run(after, complete ? 'scanning' : 'preparing', scanId);
  return Result.ok({ prepared, complete });
}
