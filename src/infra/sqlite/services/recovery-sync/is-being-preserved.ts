import { Result } from '@internxt/drive-desktop-core/build/common/result';
import { logger } from '@/apps/shared/logger/logger';
import { db } from '../../migrations/run-migrations';
import { RecoverySyncMove } from '../../schema';
import { SqliteError } from '../common/sqlite-error';

type Props = Pick<RecoverySyncMove, 'rootUuid' | 'itemType' | 'uuid'>;

/**
 * v2.7.2 Alexis Mora
 * True when recovery may have moved the item out of the sync root: its move is recorded and did not fail.
 * A failed move left the item in place, so a delete of it comes from the user.
 */
export function isBeingPreserved({ rootUuid, itemType, uuid }: Props): Result<boolean, SqliteError> {
  try {
    const row = db
      .prepare(
        `SELECT 1 FROM recovery_sync_move
         WHERE rootUuid = :rootUuid AND itemType = :itemType AND uuid = :uuid AND stage <> 'failed'`,
      )
      .get({ rootUuid, itemType, uuid });

    return Result.ok(row !== undefined);
  } catch (error) {
    logger.error({ msg: 'Error checking recovery sync move', rootUuid, itemType, uuid, error });
    return Result.err(new SqliteError('UNKNOWN', error));
  }
}
