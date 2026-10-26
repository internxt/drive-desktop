import { Result } from '@internxt/drive-desktop-core/build/common/result';
import { DatabaseSync } from 'node:sqlite';
import { z } from 'zod';
import { processSchema, RecoveryProcess } from '../../types';
import { validBatchSize } from '../storage';

/** Reads one indexed batch of unfinished processes so startup can resume work without loading every process. */
export function listUnfinishedProcesses({
  database,
  after = '',
  limit = 1000,
}: {
  database: DatabaseSync;
  after?: string;
  limit?: number;
}): Result<RecoveryProcess[]> {
  if (!validBatchSize(limit)) return Result.err(new Error('Invalid batch size'));
  const rows = database
    .prepare(
      `SELECT * FROM recovery_process INDEXED BY recovery_unfinished_processes
      WHERE stage != 'completed' AND processId > ? ORDER BY processId LIMIT ?`,
    )
    .all(after, limit);
  return Result.ok(z.array(processSchema).parse(rows));
}
