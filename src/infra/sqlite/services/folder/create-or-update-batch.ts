import { DriveFolder } from '@/apps/main/database/entities/DriveFolder';
import { logger } from '@/apps/shared/logger/logger';
import { SqliteError } from '../common/sqlite-error';
import { folderRepository } from '../drive-folder';

const BATCH_SIZE = 100;

type Props = {
  folders: DriveFolder[];
};

export async function createOrUpdateBatch({ folders }: Props) {
  if (folders.length === 0) return;

  try {
    for (let i = 0; i < folders.length; i += BATCH_SIZE) {
      const chunk = folders.slice(i, i + BATCH_SIZE);

      await folderRepository.upsert(chunk, { conflictPaths: ['uuid'] });
    }
  } catch (error) {
    logger.error({
      msg: 'Error batch creating or updating folders',
      count: folders.length,
      error,
    });

    return new SqliteError('UNKNOWN', error);
  }
}
