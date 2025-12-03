import { logger } from '@/apps/shared/logger/logger';
import { SqliteError } from '../common/sqlite-error';
import { CheckpointRepository } from '@/apps/main/database/data-source';

type Props = {
  type: 'file' | 'folder';
  userUuid: string;
  workspaceId: string;
  name: string;
  updatedAt: string;
};

export async function createOrUpdate(payload: Props) {
  try {
    logger.debug({ tag: 'SYNC-ENGINE', msg: 'Update checkpoint', payload });

    await CheckpointRepository.upsert(payload, {
      conflictPaths: ['type', 'userUuid', 'workspaceId'],
      skipUpdateIfNoValuesChanged: true,
    });

    return {};
  } catch (error) {
    logger.error({
      tag: 'SYNC-ENGINE',
      msg: 'Error creating or updating checkpoint',
      payload,
      error,
    });

    return { error: new SqliteError('UNKNOWN', error) };
  }
}
