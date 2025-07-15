import { fileRepository } from '../drive-file';
import { logger } from '@/apps/shared/logger/logger';
import { parseData } from './parse-data';
import { DriveFile } from '@/apps/main/database/entities/DriveFile';
import { SqliteError } from '../common/sqlite-error';

type Props = {
  file: DriveFile;
};

export async function createOrUpdate({ file }: Props) {
  try {
    const data = await fileRepository.save(file);

    return { data: parseData({ data }) };
  } catch (exc) {
    logger.error({
      msg: 'Error creating or updating file',
      file,
      exc,
    });

    return { error: new SqliteError('UNKNOWN', exc) };
  }
}
