import { Result } from '@internxt/drive-desktop-core/build/common/result';
import { logger } from '@/apps/shared/logger/logger';
import { db } from '../../migrations/run-migrations';
import { RecoverySyncDestination } from '../../schema';
import { SqliteError } from '../common/sqlite-error';

type Props = {
  rootUuid: string;
  volume: string;
  path: string;
};

/**
 * v2.7.2 Alexis Mora
 * The first path allocated for a volume is kept, so a resumed recovery returns it instead of the new one
 * and keeps preserving into the same directory even if the path would now be built differently.
 */
export function allocateDestination({ rootUuid, volume, path }: Props): Result<RecoverySyncDestination, SqliteError> {
  try {
    db.prepare('INSERT OR IGNORE INTO recovery_sync_destination (rootUuid, volume, path) VALUES (:rootUuid, :volume, :path)').run({
      rootUuid,
      volume,
      path,
    });

    const data = db
      .prepare('SELECT * FROM recovery_sync_destination WHERE rootUuid = :rootUuid AND volume = :volume')
      .get({ rootUuid, volume });

    return Result.ok(data as RecoverySyncDestination);
  } catch (error) {
    logger.error({ msg: 'Error allocating recovery sync destination', rootUuid, volume, error });
    return Result.err(new SqliteError('UNKNOWN', error));
  }
}
