import { Result } from '@internxt/drive-desktop-core/build/common/result';
import { DatabaseSync } from 'node:sqlite';
import { RecoveryScan, scanSchema } from '../../types';

/** Finds the unfinished scan for a Drive root and item type, including interrupted preparation. */
export function getActiveScan({
  database,
  rootUuid,
  itemType,
}: {
  database: DatabaseSync;
  rootUuid: string;
  itemType: 'file' | 'folder';
}): Result<RecoveryScan | undefined> {
  const row = database.prepare('SELECT * FROM recovery_scan WHERE rootUuid = ? AND itemType = ?').get(rootUuid, itemType);
  return Result.ok(row ? scanSchema.parse(row) : undefined);
}
