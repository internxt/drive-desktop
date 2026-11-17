import { Result } from '@internxt/drive-desktop-core/build/common/result';
import { logger } from '@/apps/shared/logger/logger';
import { db } from '../../migrations/run-migrations';
import { SqliteError } from '../common/sqlite-error';

type Props = {
  rootUuid: string;
};

export type PreservationSummary = {
  preserved: number;
  destinations: string[];
};

/**
 * v2.7.2 Alexis Mora
 * Read from the journal instead of counted in memory, so the outcome still includes moves made before a restart.
 * Only destinations that received a move are returned, an allocated one whose moves all failed has nothing to show.
 */
export function getPreservationSummary({ rootUuid }: Props): Result<PreservationSummary, SqliteError> {
  try {
    const { preserved } = db
      .prepare(`SELECT COUNT(*) AS preserved FROM recovery_sync_move WHERE rootUuid = :rootUuid AND stage = 'done'`)
      .get({ rootUuid }) as { preserved: number };

    const rows = db
      .prepare(
        `SELECT d.path FROM recovery_sync_destination d
         WHERE d.rootUuid = :rootUuid
           AND EXISTS (
             SELECT 1 FROM recovery_sync_move m
             WHERE m.rootUuid = d.rootUuid AND m.stage = 'done' AND m.destination LIKE d.path || '/%'
           )
         ORDER BY d.path`,
      )
      .all({ rootUuid }) as { path: string }[];

    return Result.ok({ preserved, destinations: rows.map(({ path }) => path) });
  } catch (error) {
    logger.error({ tag: 'RECOVERY-SYNC', msg: 'Error getting recovery sync preservation summary', rootUuid, error });
    return Result.err(new SqliteError('UNKNOWN', error));
  }
}
