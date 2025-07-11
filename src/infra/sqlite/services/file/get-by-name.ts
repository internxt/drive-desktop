import { fileRepository } from '../drive-file';
import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';
import { logger } from '@/apps/shared/logger/logger';
import { basename, extname } from 'path';
import { parseData } from './parse-data';
import { SingleItemError } from '../common/single-item-error';

type Props = {
  parentUuid: FolderUuid;
  nameWithExtension: string;
};

export async function getByName({ parentUuid, nameWithExtension }: Props) {
  try {
    const extension = extname(nameWithExtension);
    const plainName = basename(nameWithExtension, extension);

    const data = await fileRepository.findOne({
      where: {
        folderUuid: parentUuid,
        plainName,
        type: extension.slice(1),
        status: 'EXISTS',
      },
    });

    if (data) return { data: parseData({ data }) };
    return { error: new SingleItemError('NOT_FOUND') };
  } catch (exc) {
    logger.error({
      msg: 'Error getting file by name',
      parentUuid,
      nameWithExtension,
      exc,
    });

    return { error: new SingleItemError('UNKNOWN', exc) };
  }
}
