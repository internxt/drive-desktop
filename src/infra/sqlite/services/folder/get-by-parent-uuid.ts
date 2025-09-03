import { logger } from '@/apps/shared/logger/logger';
import { parseData } from './parse-data';
import { SqliteError } from '../common/sqlite-error';
import { folderRepository } from '../drive-folder';

type Props = {
  parentUuid: string;
};

export async function getByParentUuid({ parentUuid }: Props) {
  try {
    const items = await folderRepository.findBy({
      parentUuid,
      status: 'EXISTS',
    });

    return { data: items.map((item) => parseData({ data: item })) };
  } catch (exc) {
    logger.error({
      msg: 'Error getting folders by parent uuid',
      parentUuid,
      exc,
    });

    return { error: new SqliteError('UNKNOWN', exc) };
  }
}
