import { logger } from '@/apps/shared/logger/logger';
import { parseData } from './parse-data';
import { SqliteError } from '../common/sqlite-error';
import { folderRepository } from '../drive-folder';
import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';
import { In } from 'typeorm';

type Props = {
  uuids: FolderUuid[];
};

export async function getByUuids({ uuids }: Props) {
  try {
    const items = await folderRepository.findBy({
      uuid: In(uuids),
      status: 'EXISTS',
    });

    return { data: items.map((item) => parseData({ data: item })) };
  } catch (exc) {
    logger.error({
      msg: 'Error getting folders by uuids',
      exc,
    });

    return { error: new SqliteError('UNKNOWN', exc) };
  }
}
