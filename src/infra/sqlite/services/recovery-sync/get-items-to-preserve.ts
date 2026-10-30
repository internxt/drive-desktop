import { Result } from '@internxt/drive-desktop-core/build/common/result';
import { SimpleDriveFile } from '@/apps/main/database/entities/DriveFile';
import { SimpleDriveFolder } from '@/apps/main/database/entities/DriveFolder';
import { logger } from '@/apps/shared/logger/logger';
import { db } from '../../migrations/run-migrations';
import { SqliteError } from '../common/sqlite-error';
import { localItemsNotSeenOnRemoteDrive } from './local-items-not-seen-on-remote-drive';
import { ItemToPreserve, mapFileToPreserve, mapFolderToPreserve } from './map-item-to-preserve';

type Props = {
  rootUuid: string;
  userUuid: string;
  workspaceId: string;
  afterUuid?: string;
  limit?: number;
};

type Mapper<T> = (props: { row: unknown }) => Result<ItemToPreserve<T>, SqliteError>;

export function getFilesToPreserve(props: Props) {
  return getItemsToPreserve<SimpleDriveFile>({ ...props, itemType: 'file', mapper: mapFileToPreserve });
}

export function getFoldersToPreserve(props: Props) {
  return getItemsToPreserve<SimpleDriveFolder>({ ...props, itemType: 'folder', mapper: mapFolderToPreserve });
}

/**
 * v2.7.2 Alexis Mora
 * Uses uuid keyset pagination so inventories of hundreds of thousands of items are read in bounded batches.
 * Returns nothing until every scan of the type is completed, so an interrupted scan never authorizes cleanup.
 */
function getItemsToPreserve<T>({
  rootUuid,
  userUuid,
  workspaceId,
  itemType,
  mapper,
  afterUuid = '',
  limit = 1000,
}: Props & { itemType: 'file' | 'folder'; mapper: Mapper<T> }): Result<ItemToPreserve<T>[], SqliteError> {
  try {
    const rows = db
      .prepare(
        `SELECT i.*, COALESCE(o.remoteStatus, 'DELETED') AS removalStatus
         ${localItemsNotSeenOnRemoteDrive({ itemType })}
           AND i.uuid > :afterUuid
         ORDER BY i.uuid ASC
         LIMIT :limit`,
      )
      .all({ rootUuid, userUuid, workspaceId, afterUuid, limit });

    const data: ItemToPreserve<T>[] = [];
    for (const row of rows) {
      const mapped = mapper({ row });
      if (Result.isError(mapped)) {
        logger.error({ msg: 'Invalid recovery item to preserve', rootUuid, itemType, error: mapped.error });
        return Result.err(mapped.error);
      }
      data.push(mapped.data);
    }

    return Result.ok(data);
  } catch (error) {
    logger.error({ msg: 'Error getting recovery items to preserve', rootUuid, itemType, error });
    return Result.err(new SqliteError('UNKNOWN', error));
  }
}
