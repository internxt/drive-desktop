import { Result } from '@internxt/drive-desktop-core/build/common/result';
import { logger } from '@/apps/shared/logger/logger';
import { db } from '../../migrations/run-migrations';
import { SqliteError } from '../common/sqlite-error';
import { localItemsNotSeenOnRemoteDrive } from './local-items-not-seen-on-remote-drive';

type Props = {
  rootUuid: string;
  userUuid: string;
  workspaceId: string;
  itemType: 'file' | 'folder';
  uuid: string;
  removalStatus: 'TRASHED' | 'DELETED';
};

/**
 * v2.7.2 Alexis Mora
 * Preservation runs between listing an item and updating it, and the local item can change meanwhile
 * (for example the user trashes it or normal sync updates it).
 * Repeating the eligibility check inside the update makes check and write atomic,
 * so a changed item is skipped instead of overwritten.
 * Returns false when the item was skipped.
 */
export function markRemovedIfEligible({
  rootUuid,
  userUuid,
  workspaceId,
  itemType,
  uuid,
  removalStatus,
}: Props): Result<boolean, SqliteError> {
  const table = itemType === 'file' ? 'drive_file' : 'drive_folder';

  try {
    const { changes } = db
      .prepare(
        `UPDATE ${table} SET status = :removalStatus
         WHERE uuid IN (
           SELECT i.uuid ${localItemsNotSeenOnRemoteDrive({ itemType })}
             AND i.uuid = :uuid
             AND COALESCE(o.remoteStatus, 'DELETED') = :removalStatus
         )`,
      )
      .run({ rootUuid, userUuid, workspaceId, uuid, removalStatus });

    return Result.ok(changes > 0);
  } catch (error) {
    logger.error({ msg: 'Error marking recovery item as removed', rootUuid, itemType, uuid, error });
    return Result.err(new SqliteError('UNKNOWN', error));
  }
}
