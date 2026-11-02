import { Result } from '@internxt/drive-desktop-core/build/common/result';
import { logger } from '@/apps/shared/logger/logger';
import { db } from '../../migrations/run-migrations';
import { RecoverySyncMove } from '../../schema';
import { SqliteError } from '../common/sqlite-error';
import { mapMove } from './map-move';

type Props = Omit<RecoverySyncMove, 'stage'>;

/**
 * v2.7.2 Alexis Mora
 * The move is recorded before the filesystem is touched.
 * An item that already has a move keeps it,
 * so a resumed recovery gets the recorded destination back and never moves the item to a second place.
 *
 * A destination already recorded for another item returns DESTINATION_TAKEN, so the caller allocates another one
 * instead of treating someone else's preserved copy as this item's.
 */
export function reserveMove(props: Props): Result<RecoverySyncMove, SqliteError> {
  const { rootUuid, itemType, uuid } = props;

  try {
    db.prepare(
      `INSERT INTO recovery_sync_move (rootUuid, itemType, uuid, source, destination, removalStatus, sourceSize, sourceModifiedAt)
       VALUES (:rootUuid, :itemType, :uuid, :source, :destination, :removalStatus, :sourceSize, :sourceModifiedAt)
       ON CONFLICT (rootUuid, itemType, uuid) DO NOTHING`,
    ).run(props);

    const row = db
      .prepare('SELECT * FROM recovery_sync_move WHERE rootUuid = :rootUuid AND itemType = :itemType AND uuid = :uuid')
      .get({ rootUuid, itemType, uuid });

    return mapMove({ row });
  } catch (error) {
    if (error instanceof Error && error.message.includes('recovery_sync_move.destination')) {
      return Result.err(new SqliteError('DESTINATION_TAKEN', error));
    }

    logger.error({ msg: 'Error reserving recovery sync move', rootUuid, itemType, uuid, error });
    return Result.err(new SqliteError('UNKNOWN', error));
  }
}
