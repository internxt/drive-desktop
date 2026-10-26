import { Result } from '@internxt/drive-desktop-core/build/common/result';
import { DatabaseSync } from 'node:sqlite';
import { z } from 'zod';
import { scanSchema } from '../../types';

/** Saves candidate observations and recovery progress together after page reconciliation; execute with transaction: true. */
export function commitScanPage({
  database,
  scanId,
  observations,
  updatedAt,
  complete = false,
}: {
  database: DatabaseSync;
  scanId: number;
  observations: readonly { uuid: string; removal?: { status: 'TRASHED' | 'DELETED'; updatedAt: string } }[];
  updatedAt: string;
  complete?: boolean;
}): Result<void> {
  if (observations.length > 1000 || !z.iso.datetime().safeParse(updatedAt).success) return Result.err(new Error('Invalid recovery page'));
  const row = database
    .prepare(
      `SELECT s.* FROM recovery_scan s JOIN recovery_process p USING (rootUuid)
      WHERE scanId = ? AND s.stage = 'scanning' AND p.stage = 'scanning'`,
    )
    .get(scanId);
  if (!row) return Result.err(new Error('Recovery scan is not active'));
  const scan = scanSchema.parse(row);
  if (Date.parse(updatedAt) < Date.parse(scan.updatedAt)) return Result.err(new Error('Recovery progress cannot move backwards'));
  const observe = database.prepare(`UPDATE recovery_candidate SET observed = 1, removedStatus = ?, removedAt = ?
      WHERE scanId = ? AND uuid = ?`);
  for (const observation of observations) {
    if (observation.removal && !z.iso.datetime().safeParse(observation.removal.updatedAt).success) {
      return Result.err(new Error('Invalid removal timestamp'));
    }
    observe.run(observation.removal?.status ?? null, observation.removal?.updatedAt ?? null, scanId, observation.uuid);
  }
  // v2.7.1: observations and timestamp must commit together so inclusive replay never skips unseen candidates.
  database
    .prepare('UPDATE recovery_scan SET updatedAt = ?, stage = ? WHERE scanId = ?')
    .run(updatedAt, complete ? 'completed' : 'scanning', scanId);
  return Result.ok(undefined);
}
