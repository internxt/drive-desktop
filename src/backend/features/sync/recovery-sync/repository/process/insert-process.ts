import { Result } from '@internxt/drive-desktop-core/build/common/result';
import { DatabaseSync } from 'node:sqlite';
import { z } from 'zod';
import { processSchema, RecoveryProcess } from '../../types';

/** Inserts a process in preparation; scan registration belongs to the enclosing creation transaction. */
export function insertProcess({
  database,
  rootUuid,
  startedAt,
}: {
  database: DatabaseSync;
  rootUuid: string;
  startedAt: string;
}): Result<RecoveryProcess> {
  if (!z.iso.datetime().safeParse(startedAt).success) return Result.err(new Error('Invalid recovery start date'));
  const row = database.prepare('INSERT INTO recovery_process (rootUuid, startedAt) VALUES (?, ?) RETURNING *').get(rootUuid, startedAt);
  return Result.ok(processSchema.parse(row));
}
