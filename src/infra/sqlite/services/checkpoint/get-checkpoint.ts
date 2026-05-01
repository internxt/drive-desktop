import { logger } from '@/apps/shared/logger/logger';
import { db } from '../../migrations/run-migrations';
import { Checkpoint } from '../../schema';
import { SingleItemError } from '../common/single-item-error';

type Props = {
  type: 'file' | 'folder';
  userUuid: string;
  workspaceId: string;
};

export function getCheckpoint(payload: Props) {
  try {
    const data = db
      .prepare(
        `SELECT * FROM checkpoint
         WHERE type = :type AND userUuid = :userUuid AND workspaceId = :workspaceId
         LIMIT 1`,
      )
      .get(payload);

    if (data) return { data: data as Checkpoint };
    return { error: new SingleItemError('NOT_FOUND') };
  } catch (error) {
    logger.error({
      tag: 'SYNC-ENGINE',
      msg: 'Error getting checkpoint',
      payload,
      error,
    });

    return { error: new SingleItemError('UNKNOWN', error) };
  }
}
