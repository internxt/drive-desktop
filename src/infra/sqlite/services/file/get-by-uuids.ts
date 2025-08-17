import { fileRepository } from '../drive-file';
import { logger } from '@/apps/shared/logger/logger';
import { parseData } from './parse-data';
import { SqliteError } from '../common/sqlite-error';
import { In } from 'typeorm';
import { FileUuid } from '@/apps/main/database/entities/DriveFile';

type Props = {
  uuids: FileUuid[];
};

export async function getByUuids({ uuids }: Props) {
  try {
    const items = await fileRepository.findBy({
      uuid: In(uuids),
      status: 'EXISTS',
    });

    return { data: items.map((item) => parseData({ data: item })) };
  } catch (exc) {
    logger.error({
      msg: 'Error getting files by uuids',
      exc,
    });

    return { error: new SqliteError('UNKNOWN', exc) };
  }
}
