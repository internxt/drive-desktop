import { Result } from '@internxt/drive-desktop-core/build/common/result';
import { logger } from '@/apps/shared/logger/logger';
import { db } from '../../migrations/run-migrations';
import { SqliteError } from '../common/sqlite-error';

type Props = {
  rootUuid: string;
  userUuid: string;
  workspaceId: string;
  folderUuid: string;
};

/**
 * v2.7.2 Alexis Mora
 * A removed folder is moved as a whole, with everything below it, unless something below it changed at or after
 * the checkpoint or there is no completed scan of its type to decide. Then the folder stays and its removed files
 * are preserved one by one.
 * Descendants that are already removed locally are not followed, their contents are preserved by their own removal.
 *
 * v2.7.4 Alexis Mora
 * A descendant the scan saw existing is not protected. Trashing a folder in the web only marks the folder, so its contents
 * are still reported as existing and every trashed folder with contents was kept. A descendant that was moved remotely to
 * another folder is no longer below this one, because the scan already wrote its new parent locally.
 */
export function hasProtectedDescendants({ rootUuid, userUuid, workspaceId, folderUuid }: Props): Result<boolean, SqliteError> {
  try {
    const row = db
      .prepare(
        `WITH RECURSIVE tree(uuid) AS (
           SELECT :folderUuid
           UNION
           SELECT f.uuid FROM drive_folder f JOIN tree t ON f.parentUuid = t.uuid
           WHERE f.userUuid = :userUuid AND f.workspaceId = :workspaceId AND f.status = 'EXISTS'
         )
         SELECT 1 FROM drive_folder i
         ${protectedItem({ itemType: 'folder', parentColumn: 'parentUuid' })}
         UNION ALL
         SELECT 1 FROM drive_file i
         ${protectedItem({ itemType: 'file', parentColumn: 'folderUuid' })}
         LIMIT 1`,
      )
      .get({ rootUuid, userUuid, workspaceId, folderUuid });

    return Result.ok(row !== undefined);
  } catch (error) {
    logger.error({ tag: 'RECOVERY-SYNC', msg: 'Error checking protected recovery sync descendants', rootUuid, folderUuid, error });
    return Result.err(new SqliteError('UNKNOWN', error));
  }
}

function protectedItem({ itemType, parentColumn }: { itemType: 'file' | 'folder'; parentColumn: string }) {
  return `
    LEFT JOIN recovery_sync_scan s ON s.rootUuid = :rootUuid AND s.itemType = '${itemType}' AND s.completed = 1
    WHERE i.${parentColumn} IN (SELECT uuid FROM tree)
      AND i.userUuid = :userUuid
      AND i.workspaceId = :workspaceId
      AND i.status = 'EXISTS'
      AND (s.checkpoint IS NULL OR julianday(i.updatedAt) >= julianday(s.checkpoint))`;
}
