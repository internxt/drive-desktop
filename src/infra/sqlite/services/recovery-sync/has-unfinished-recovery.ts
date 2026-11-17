import { Result } from '@internxt/drive-desktop-core/build/common/result';
import { logger } from '@/apps/shared/logger/logger';
import { db } from '../../migrations/run-migrations';
import { SqliteError } from '../common/sqlite-error';

type Props = {
  rootUuid: string;
};

/**
 * v2.7.2 Alexis Mora
 * The process row exists from the start of a recovery until it is cleared at its end,
 * so a row found when the app starts belongs to a recovery the app closed in the middle of.
 */
export function hasUnfinishedRecovery({ rootUuid }: Props): Result<boolean, SqliteError> {
  try {
    const row = db.prepare('SELECT 1 FROM recovery_sync_process WHERE rootUuid = :rootUuid').get({ rootUuid });
    return Result.ok(row !== undefined);
  } catch (error) {
    logger.error({ tag: 'RECOVERY-SYNC', msg: 'Error checking unfinished recovery sync', rootUuid, error });
    return Result.err(new SqliteError('UNKNOWN', error));
  }
}
