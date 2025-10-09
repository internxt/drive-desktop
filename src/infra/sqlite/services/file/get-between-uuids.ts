import { fileRepository } from '../drive-file';
import { logger } from '@/apps/shared/logger/logger';
import { parseData } from './parse-data';
import { SqliteError } from '../common/sqlite-error';
import { Between } from 'typeorm';
import { FileUuid } from '@/apps/main/database/entities/DriveFile';

type Props = {
  workspaceId: string;
  firstUuid: FileUuid;
  lastUuid: FileUuid;
};

export async function getBetweenUuids({ workspaceId, firstUuid, lastUuid }: Props) {
  try {
    const items = await fileRepository.find({
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
      msg: 'Error getting files between uuids',
      error,
    });

    return { error: new SqliteError('UNKNOWN', error) };
  }
}
