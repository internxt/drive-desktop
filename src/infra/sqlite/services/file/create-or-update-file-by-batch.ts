import { fileRepository } from '../drive-file';
import { logger } from '@internxt/drive-desktop-core/build/backend';
import { parseData } from './parse-data';
import { SqliteError } from '../common/sqlite-error';
import { RemoteSyncedFile } from 'src/apps/main/remote-sync/helpers';

const BATCH_SIZE = 500;

type Props = {
  files: RemoteSyncedFile[];
};

export async function createOrUpdateFileByBatch({ files }: Props) {
  if (files.length === 0) return { data: [] };

  try {
    for (let i = 0; i < files.length; i += BATCH_SIZE) {
      const chunk = files.slice(i, i + BATCH_SIZE);

      await fileRepository.upsert(chunk, {
        conflictPaths: ['uuid'],
      });
    }

    return { data: files.map((data) => parseData({ data })) };
  } catch (error) {
    logger.error({
      msg: 'Error batch creating or updating files',
      count: files.length,
      error,
    });

    return { error: new SqliteError('UNKNOWN', error) };
  }
}
