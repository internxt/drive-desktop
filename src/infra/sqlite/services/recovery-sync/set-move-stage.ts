import { Result } from '@internxt/drive-desktop-core/build/common/result';
import { logger } from '@/apps/shared/logger/logger';
import { db } from '../../migrations/run-migrations';
import { RecoverySyncMove, RecoverySyncMoveStage } from '../../schema';
import { SqliteError } from '../common/sqlite-error';

type Props = Pick<RecoverySyncMove, 'rootUuid' | 'itemType' | 'uuid'> & {
  stage: RecoverySyncMoveStage;
};

/**
 * v2.7.2 Alexis Mora
 * A failed move goes back to reserved when a later recovery retries it.
 * A conflict is final: the item changed locally, so it belongs to normal sync and recovery leaves it alone.
 */
const PREVIOUS_STAGES: Record<RecoverySyncMoveStage, RecoverySyncMoveStage[]> = {
  reserved: ['failed'],
  moved: ['reserved'],
  done: ['moved'],
  conflict: ['reserved', 'moved'],
  failed: ['reserved'],
};

/**
 * v2.7.2 Alexis Mora
 * The stage only changes from its allowed previous stages, so repeating a step after a restart changes nothing
 * and a move can never go back from done. Returns false when the stage was not changed.
 */
export function setMoveStage({ rootUuid, itemType, uuid, stage }: Props): Result<boolean, SqliteError> {
  const previous = PREVIOUS_STAGES[stage].map((s) => `'${s}'`).join(', ');

  try {
    const { changes } = db
      .prepare(
        `UPDATE recovery_sync_move SET stage = :stage
         WHERE rootUuid = :rootUuid AND itemType = :itemType AND uuid = :uuid AND stage IN (${previous})`,
      )
      .run({ rootUuid, itemType, uuid, stage });

    return Result.ok(changes > 0);
  } catch (error) {
    logger.error({ msg: 'Error setting recovery sync move stage', rootUuid, itemType, uuid, stage, error });
    return Result.err(new SqliteError('UNKNOWN', error));
  }
}
