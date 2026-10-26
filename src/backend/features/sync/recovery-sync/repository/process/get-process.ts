import { Result } from '@internxt/drive-desktop-core/build/common/result';
import { DatabaseSync } from 'node:sqlite';
import { processSchema, RecoveryProcess } from '../../types';

/** Reads a validated process by identity, returning undefined when it does not exist. */
export function getProcess({ database, rootUuid }: { database: DatabaseSync; rootUuid: string }): Result<RecoveryProcess | undefined> {
  const row = database.prepare('SELECT * FROM recovery_process WHERE rootUuid = ?').get(rootUuid);
  return Result.ok(row ? processSchema.parse(row) : undefined);
}
