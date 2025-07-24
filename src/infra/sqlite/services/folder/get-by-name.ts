import { folderRepository } from '../drive-folder';
import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';
import { logger } from '@/apps/shared/logger/logger';
import { basename, extname } from 'path';
import { parseData } from './parse-data';
import { SingleItemError } from '../common/single-item-error';

type Props = {
  parentUuid: FolderUuid;
  plainName: string;
};

export async function getByName({ parentUuid, plainName }: Props) {
  try {
    const data = await folderRepository.findOne({
      where: {
        parentUuid,
        plainName,
        status: 'EXISTS',
      },
    });

    if (data) return { data: parseData({ data }) };
    return { error: new SingleItemError('NOT_FOUND') };
  } catch (exc) {
    logger.error({
      msg: 'Error getting folder by name',
      parentUuid,
      plainName,
      exc,
    });

    return { error: new SingleItemError('UNKNOWN', exc) };
  }
}
