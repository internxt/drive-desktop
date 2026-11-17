import { Result } from '@internxt/drive-desktop-core/build/common/result';
import { logger } from '@/apps/shared/logger/logger';
import { db } from '../../migrations/run-migrations';
import { RecoverySyncMove } from '../../schema';
import { SqliteError } from '../common/sqlite-error';
import { mapMove } from './map-move';

type Props = {
  rootUuid: string;
  itemType: 'file' | 'folder';
  afterUuid?: string;
  limit?: number;
};

/**
 * v2.7.2 Alexis Mora
 * Moves interrupted before done, read in uuid batches, so a restart can finish them before anything else touches their items.
 */
export function getUnfinishedMoves({ rootUuid, itemType, afterUuid = '', limit = 1000 }: Props): Result<RecoverySyncMove[], SqliteError> {
  try {
    const rows = db
      .prepare(
        `SELECT * FROM recovery_sync_move
         WHERE rootUuid = :rootUuid AND itemType = :itemType AND stage IN ('reserved', 'moved') AND uuid > :afterUuid
         ORDER BY uuid ASC
         LIMIT :limit`,
      )
      .all({ rootUuid, itemType, afterUuid, limit });

    const data: RecoverySyncMove[] = [];
    for (const row of rows) {
      const mapped = mapMove({ row });
      if (Result.isError(mapped)) {
        logger.error({ tag: 'RECOVERY-SYNC', msg: 'Invalid recovery sync move', rootUuid, itemType, error: mapped.error });
        return Result.err(mapped.error);
      }
      data.push(mapped.data);
    }

    return Result.ok(data);
  } catch (error) {
    logger.error({ tag: 'RECOVERY-SYNC', msg: 'Error getting unfinished recovery sync moves', rootUuid, itemType, error });
    return Result.err(new SqliteError('UNKNOWN', error));
  }
}
