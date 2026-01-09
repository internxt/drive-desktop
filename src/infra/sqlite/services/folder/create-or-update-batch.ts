import { folderRepository } from '../drive-folder';
import { logger } from '@/apps/shared/logger/logger';
import { parseData } from './parse-data';
import { DriveFolder } from '@/apps/main/database/entities/DriveFolder';
import { SqliteError } from '../common/sqlite-error';

const BATCH_SIZE = 100;

type Props = {
  folders: DriveFolder[];
};

export async function createOrUpdateBatch({ folders }: Props) {
  if (folders.length === 0) return { data: [] };

  try {
    for (let i = 0; i < folders.length; i += BATCH_SIZE) {
      const chunk = folders.slice(i, i + BATCH_SIZE);

      await folderRepository.upsert(chunk, { conflictPaths: ['uuid'] });
    }

    return { data: folders.map((data) => parseData({ data })) };
  } catch (error) {
    logger.error({
      msg: 'Error batch creating or updating folders',
      count: folders.length,
      error,
    });

    return { error: new SqliteError('UNKNOWN', error) };
  }
}
