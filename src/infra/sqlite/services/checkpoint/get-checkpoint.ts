import { logger } from '@/apps/shared/logger/logger';
import { SingleItemError } from '../common/single-item-error';
import { CheckpointRepository } from '@/apps/main/database/data-source';

type Props = {
  type: 'file' | 'folder';
  userUuid: string;
  workspaceId: string;
};

export async function getCheckpoint(payload: Props) {
  try {
    const data = await CheckpointRepository.findOne({ where: payload });

    if (data) return { data };

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
