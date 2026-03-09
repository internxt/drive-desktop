import { fileRepository } from '../drive-file';
import { logger } from '@/apps/shared/logger/logger';
import { DriveFile } from '@/apps/main/database/entities/DriveFile';
import { SqliteError } from '../common/sqlite-error';

const BATCH_SIZE = 100;

type Props = {
  files: DriveFile[];
};

export async function createOrUpdateBatch({ files }: Props) {
  if (files.length === 0) return;

  try {
    for (let i = 0; i < files.length; i += BATCH_SIZE) {
      const chunk = files.slice(i, i + BATCH_SIZE);

      await fileRepository.upsert(chunk, { conflictPaths: ['uuid'] });
    }
  } catch (error) {
    logger.error({
      msg: 'Error batch creating or updating files',
      count: files.length,
      error,
    });

    return new SqliteError('UNKNOWN', error);
  }
}
