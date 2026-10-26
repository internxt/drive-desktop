import { Result } from '@internxt/drive-desktop-core/build/common/result';
import { DatabaseSync } from 'node:sqlite';
import { z } from 'zod';
import { processSchema, RecoveryProcess } from '../../types';

/** Inserts a process in preparation; scan registration belongs to the enclosing creation transaction. */
export function insertProcess({
  database,
  processId,
  startedAt,
}: {
  database: DatabaseSync;
  processId: string;
  startedAt: string;
}): Result<RecoveryProcess> {
  if (!z.iso.datetime().safeParse(startedAt).success) return Result.err(new Error('Invalid recovery start date'));
  const row = database.prepare('INSERT INTO recovery_process (processId, startedAt) VALUES (?, ?) RETURNING *').get(processId, startedAt);
  return Result.ok(processSchema.parse(row));
}
