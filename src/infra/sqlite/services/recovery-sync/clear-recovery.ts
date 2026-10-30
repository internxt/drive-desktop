import { Result } from '@internxt/drive-desktop-core/build/common/result';
import { logger } from '@/apps/shared/logger/logger';
import { db } from '../../migrations/run-migrations';
import { SqliteError } from '../common/sqlite-error';

type Props = {
  rootUuid: string;
};

/**
 * v2.7.2 Alexis Mora
 * Called once a recovery-sync has finished so the next one scans from the epoch again and rechecks historical state.
 * Nothing of a completed recovery is kept: the process row goes too, so the next run starts with its own date.
 */
export function clearRecovery({ rootUuid }: Props): Result<void, SqliteError> {
  try {
    db.exec('BEGIN');
    db.prepare('DELETE FROM recovery_sync_observed WHERE rootUuid = :rootUuid').run({ rootUuid });
    db.prepare('DELETE FROM recovery_sync_scan WHERE rootUuid = :rootUuid').run({ rootUuid });
    db.prepare('DELETE FROM recovery_sync_process WHERE rootUuid = :rootUuid').run({ rootUuid });
    db.exec('COMMIT');
    return Result.ok(undefined);
  } catch (error) {
    if (db.isTransaction) db.exec('ROLLBACK');
    logger.error({ msg: 'Error clearing recovery state', rootUuid, error });
    return Result.err(new SqliteError('UNKNOWN', error));
  }
}
