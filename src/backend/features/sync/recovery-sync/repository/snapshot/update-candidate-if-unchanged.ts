import { Result } from '@internxt/drive-desktop-core/build/common/result';
import { DatabaseSync } from 'node:sqlite';
import { DriveFile, DriveFolder } from '@/infra/sqlite/schema';
import { RecoveryScan } from '../../types';
import { itemStorage } from '../storage';

export function updateCandidateIfUnchanged({
  database,
  scan,
  item,
}: {
  database: DatabaseSync;
  scan: Pick<RecoveryScan, 'scanId' | 'itemType' | 'userUuid' | 'workspaceId'>;
  item: DriveFile | DriveFolder;
}): Result<boolean> {
  try {
    const { table, columns, snapshot } = itemStorage(scan.itemType);
    const payload = JSON.stringify(item);
    const assignments = columns.map((column) => `${column} = json_extract(?, '$.${column}')`).join(', ');
    // Keep the version check in the write so concurrent local changes cannot be overwritten; identical replay is safe.
    const result = database
      .prepare(
        `UPDATE ${table} SET ${assignments}
        WHERE uuid = ? AND userUuid = ? AND workspaceId = ? AND (${snapshot} =
          (SELECT original FROM recovery_candidate WHERE scanId = ? AND uuid = ?) OR ${snapshot} = ?)`,
      )
      .run(...columns.map(() => payload), item.uuid, scan.userUuid, scan.workspaceId, scan.scanId, item.uuid, payload);
    return Result.ok(Boolean(result.changes));
  } catch (cause) {
    return Result.err(cause instanceof Error ? cause : new Error(String(cause)));
  }
}
