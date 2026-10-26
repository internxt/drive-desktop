import { Result } from '@internxt/drive-desktop-core/build/common/result';
import { DatabaseSync } from 'node:sqlite';
import { RecoveryScan, scanSchema } from '../../types';

export function getScanningScan({ database, scanId }: { database: DatabaseSync; scanId: number }): Result<RecoveryScan | undefined> {
  try {
    const row = database
      .prepare(
        `SELECT s.* FROM recovery_scan s JOIN recovery_process p USING (rootUuid)
        WHERE scanId = ? AND s.stage = 'scanning' AND p.stage = 'scanning'`,
      )
      .get(scanId);
    return Result.ok(row ? scanSchema.parse(row) : undefined);
  } catch (cause) {
    return Result.err(cause instanceof Error ? cause : new Error(String(cause)));
  }
}
