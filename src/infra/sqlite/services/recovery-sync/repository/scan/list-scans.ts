import { Result } from '@internxt/drive-desktop-core/build/common/result';
import { DatabaseSync } from 'node:sqlite';
import { z } from 'zod';
import { validBatchSize } from '../../storage';
import { RecoveryScan, scanSchema } from '../../types';

/** Reads a bounded batch of a process's scans using scan identity as the continuation position. */
export function listScans({
  database,
  processId,
  after = 0,
  limit = 1000,
}: {
  database: DatabaseSync;
  processId: string;
  after?: number;
  limit?: number;
}): Result<RecoveryScan[]> {
  if (!validBatchSize(limit)) return Result.err(new Error('Invalid batch size'));
  const rows = database
    .prepare('SELECT * FROM recovery_scan WHERE processId = ? AND scanId > ? ORDER BY scanId LIMIT ?')
    .all(processId, after, limit);
  return Result.ok(z.array(scanSchema).parse(rows));
}
