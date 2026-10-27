import { Result } from '@internxt/drive-desktop-core/build/common/result';
import { logger } from '@/apps/shared/logger/logger';
import { db } from '../../migrations/run-migrations';
import { SqliteError } from '../common/sqlite-error';

type Props = {
  rootUuid: string;
};

/**
 * v2.7.2 Alexis Mora
 * Cleanup treats absence from the scan as absence remotely, which is only true once every scan of the root reached the end of its cursor.
 * A root without scans has nothing to clean up.
 */
export function areScansCompleted({ rootUuid }: Props): Result<boolean, SqliteError> {
  try {
    const { total, completed } = db
      .prepare(
        `SELECT COUNT(*) AS total, COALESCE(SUM(completed), 0) AS completed
         FROM recovery_sync_scan WHERE rootUuid = :rootUuid`,
      )
      .get({ rootUuid }) as { total: number; completed: number };

    return Result.ok(total > 0 && total === completed);
  } catch (error) {
    logger.error({ msg: 'Error checking recovery scans', rootUuid, error });
    return Result.err(new SqliteError('UNKNOWN', error));
  }
}
