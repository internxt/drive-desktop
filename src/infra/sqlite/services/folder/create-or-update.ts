import { logger } from '@/apps/shared/logger/logger';
import { parseData } from './parse-data';
import { DriveFolder } from '@/apps/main/database/entities/DriveFolder';
import { SqliteError } from '../common/sqlite-error';
import { folderRepository } from '../drive-folder';

type Props = {
  folder: DriveFolder;
};

export async function createOrUpdate({ folder }: Props) {
  try {
    const data = await folderRepository.save(folder);

    return { data: parseData({ data }) };
  } catch (exc) {
    logger.error({
      msg: 'Error creating or updating folder',
      folder,
      exc,
    });

    return { error: new SqliteError('UNKNOWN', exc) };
  }
}
