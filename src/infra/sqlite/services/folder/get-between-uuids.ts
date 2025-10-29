import { folderRepository } from '../drive-folder';
import { logger } from '@/apps/shared/logger/logger';
import { parseData } from './parse-data';
import { SqliteError } from '../common/sqlite-error';
import { Between } from 'typeorm';
import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';

type Props = {
  workspaceId: string;
  firstUuid: FolderUuid;
  lastUuid: FolderUuid;
};

export async function getBetweenUuids({ workspaceId, firstUuid, lastUuid }: Props) {
  try {
    const items = await folderRepository.find({
      order: { uuid: 'ASC' },
      where: {
        workspaceId,
        status: 'EXISTS',
        uuid: Between(firstUuid, lastUuid),
      },
    });

    return { data: items.map((item) => parseData({ data: item })) };
  } catch (error) {
    logger.error({
      msg: 'Error getting folders between uuids',
      error,
    });

    return { error: new SqliteError('UNKNOWN', error) };
  }
}
