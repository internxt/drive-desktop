import { Result } from '@internxt/drive-desktop-core/build/common/result';
import { logger } from '@/apps/shared/logger/logger';
import { db } from '../../migrations/run-migrations';
import { RecoverySyncProcess } from '../../schema';
import { SqliteError } from '../common/sqlite-error';

type Props = {
  rootUuid: string;
  startedAt: string;
};

/**
 * v2.7.2 Alexis Mora
 * The manual run takes startedAt once and passes it to every context, so all of them share the same dated destination directory.
 * An interrupted context still has its row, so it resumes with its original startedAt and keeps that directory across restarts.
 */
export function startOrResumeProcess({ rootUuid, startedAt }: Props): Result<RecoverySyncProcess, SqliteError> {
  try {
    db.prepare('INSERT OR IGNORE INTO recovery_sync_process (rootUuid, startedAt) VALUES (:rootUuid, :startedAt)').run({
      rootUuid,
      startedAt,
    });

    const data = db.prepare('SELECT * FROM recovery_sync_process WHERE rootUuid = :rootUuid').get({ rootUuid });

    return Result.ok(data as RecoverySyncProcess);
  } catch (error) {
    logger.error({ msg: 'Error starting or resuming recovery sync process', rootUuid, error });
    return Result.err(new SqliteError('UNKNOWN', error));
  }
}
