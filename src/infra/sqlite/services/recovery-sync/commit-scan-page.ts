import { Result } from '@internxt/drive-desktop-core/build/common/result';
import { logger } from '@/apps/shared/logger/logger';
import { db } from '../../migrations/run-migrations';
import { RecoverySyncObserved } from '../../schema';
import { SqliteError } from '../common/sqlite-error';

type Props = {
  rootUuid: string;
  itemType: 'file' | 'folder';
  items: Pick<RecoverySyncObserved, 'uuid' | 'remoteStatus'>[];
  updatedAt: string;
  completed: boolean;
};

/**
 * v2.7.1 Alexis Mora
 * Observations and progress are committed together: if progress could be saved without its observations,
 * an inclusive resume would start after them and cleanup would treat those items as missing remotely.
 * Equal timestamps are accepted because a resume replays the last saved timestamp.
 * Pages arrive in ascending updatedAt order, so a later observation of the same uuid replaces the earlier status.
 */
export function commitScanPage({ rootUuid, itemType, items, updatedAt, completed }: Props): Result<void, SqliteError> {
  try {
    db.exec('BEGIN');

    const { changes } = db
      .prepare(
        `UPDATE recovery_sync_scan SET updatedAt = :updatedAt, completed = :completed
         WHERE rootUuid = :rootUuid AND itemType = :itemType AND completed = 0
           AND julianday(:updatedAt) >= julianday(updatedAt)`,
      )
      .run({ rootUuid, itemType, updatedAt, completed: completed ? 1 : 0 });

    if (!changes) {
      db.exec('ROLLBACK');
      return Result.err(new SqliteError('INVALID_PROGRESS'));
    }

    const stmt = db.prepare(
      `INSERT INTO recovery_sync_observed (rootUuid, itemType, uuid, remoteStatus)
       VALUES (:rootUuid, :itemType, :uuid, :remoteStatus)
       ON CONFLICT (rootUuid, itemType, uuid) DO UPDATE SET remoteStatus = excluded.remoteStatus`,
    );

    for (const { uuid, remoteStatus } of items) {
      stmt.run({ rootUuid, itemType, uuid, remoteStatus });
    }

    db.exec('COMMIT');
    return Result.ok(undefined);
  } catch (error) {
    if (db.isTransaction) db.exec('ROLLBACK');
    logger.error({ msg: 'Error committing recovery scan page', rootUuid, itemType, updatedAt, error });
    return Result.err(new SqliteError('UNKNOWN', error));
  }
}
