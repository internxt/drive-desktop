import { folderRepository } from '../drive-folder';
import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';
import { logger } from '@/apps/shared/logger/logger';
import { SingleItemError } from '../common/single-item-error';
import { parseData } from './parse-data';

type Props = {
  parentUuid: FolderUuid;
  name: string;
};

export async function getByName({ parentUuid, name }: Props) {
  try {
    const data = await folderRepository.findOne({
      where: { parentUuid, plainName: name, status: 'EXISTS' },
    });

    if (data) return { data: parseData({ data }) };

    return { error: new SingleItemError('NOT_FOUND') };
  } catch (exc) {
    logger.error({
      msg: 'Error getting folder by name',
      parentUuid,
      name,
      exc,
    });

    return { error: new SingleItemError('UNKNOWN', exc) };
  }
}
