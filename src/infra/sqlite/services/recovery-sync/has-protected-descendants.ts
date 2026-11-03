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
 * A removed folder is moved as a whole only when nothing below it must stay in the Drive.
 * A descendant must stay when it still exists locally and recovery cannot remove it: the completed scan saw it existing,
 * for example because it was moved remotely to another folder, it was updated at or after the checkpoint,
 * or there is no completed scan of its type to decide.
 * Descendants that are already removed locally are not followed, their contents are preserved by their own removal.
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
    logger.error({ msg: 'Error checking protected recovery sync descendants', rootUuid, folderUuid, error });
    return Result.err(new SqliteError('UNKNOWN', error));
  }
}

function protectedItem({ itemType, parentColumn }: { itemType: 'file' | 'folder'; parentColumn: string }) {
  return `
    LEFT JOIN recovery_sync_scan s ON s.rootUuid = :rootUuid AND s.itemType = '${itemType}' AND s.completed = 1
    LEFT JOIN recovery_sync_observed o ON o.rootUuid = :rootUuid AND o.itemType = '${itemType}' AND o.uuid = i.uuid
    WHERE i.${parentColumn} IN (SELECT uuid FROM tree)
      AND i.userUuid = :userUuid
      AND i.workspaceId = :workspaceId
      AND i.status = 'EXISTS'
      AND (s.checkpoint IS NULL OR julianday(i.updatedAt) >= julianday(s.checkpoint) OR o.remoteStatus = 'EXISTS')`;
}
