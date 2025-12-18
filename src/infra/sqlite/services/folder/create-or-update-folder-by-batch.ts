import { folderRepository } from '../drive-folder';
import { logger } from '@internxt/drive-desktop-core/build/backend';
import { parseData } from './parse-data';
import { SqliteError } from '../common/sqlite-error';
import { RemoteSyncedFolder } from 'src/apps/main/remote-sync/helpers';

const BATCH_SIZE = 500;

type Props = {
  folders: RemoteSyncedFolder[];
};

export async function createOrUpdateFolderByBatch({ folders }: Props) {
  if (folders.length === 0) return { data: [] };

  try {
    for (let i = 0; i < folders.length; i += BATCH_SIZE) {
      const chunk = folders.slice(i, i + BATCH_SIZE);

      await folderRepository.upsert(chunk, {
        conflictPaths: ['uuid'],
      });
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
