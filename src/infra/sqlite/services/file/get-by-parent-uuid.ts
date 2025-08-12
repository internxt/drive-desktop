import { fileRepository } from '../drive-file';
import { logger } from '@/apps/shared/logger/logger';
import { parseData } from './parse-data';
import { SqliteError } from '../common/sqlite-error';
import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';

type Props = {
  parentUuid: FolderUuid;
};

export async function getByParentUuid({ parentUuid }: Props) {
  try {
    const items = await fileRepository.findBy({
      folderUuid: parentUuid,
      status: 'EXISTS',
    });

    return { data: items.map((item) => parseData({ data: item })) };
  } catch (exc) {
    logger.error({
      msg: 'Error getting files by parent uuid',
      parentUuid,
      exc,
    });

    return { error: new SqliteError('UNKNOWN', exc) };
  }
}
