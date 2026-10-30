import { Result } from '@internxt/drive-desktop-core/build/common/result';
import { logger } from '@/apps/shared/logger/logger';
import { db } from '../../migrations/run-migrations';
import { RecoverySyncScan } from '../../schema';
import { SingleItemError } from '../common/single-item-error';

type Props = {
  rootUuid: string;
  userUuid: string;
  workspaceId: string;
  itemType: 'file' | 'folder';
};

/**
 * v2.7.2 Alexis Mora
 * The normal checkpoint is captured only when the scan starts,
 * so a resumed scan keeps protecting the same items even if normal sync advanced the checkpoint in between.
 * Without a checkpoint normal sync has not persisted any item of this type yet,
 * so there is nothing to recover and no boundary to protect newer items; recovery leaves it to normal sync and returns NOT_FOUND.
 */
export function startOrResumeScan({ rootUuid, userUuid, workspaceId, itemType }: Props): Result<RecoverySyncScan, SingleItemError> {
  try {
    db.prepare(
      `INSERT OR IGNORE INTO recovery_sync_scan (rootUuid, itemType, checkpoint)
       SELECT :rootUuid, :itemType, updatedAt FROM checkpoint
       WHERE type = :itemType AND userUuid = :userUuid AND workspaceId = :workspaceId`,
    ).run({ rootUuid, userUuid, workspaceId, itemType });

    const data = db
      .prepare('SELECT * FROM recovery_sync_scan WHERE rootUuid = :rootUuid AND itemType = :itemType')
      .get({ rootUuid, itemType });

    if (data) return Result.ok(data as RecoverySyncScan);
    return Result.err(new SingleItemError('NOT_FOUND'));
  } catch (error) {
    logger.error({ msg: 'Error starting or resuming recovery scan', rootUuid, itemType, error });
    return Result.err(new SingleItemError('UNKNOWN', error));
  }
}
