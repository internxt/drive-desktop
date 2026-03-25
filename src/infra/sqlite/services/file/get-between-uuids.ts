import { Between } from 'typeorm';
import { FileUuid } from '@/apps/main/database/entities/DriveFile';
import { logger } from '@/apps/shared/logger/logger';
import { SqliteError } from '../common/sqlite-error';
import { fileRepository } from '../drive-file';
import { parseData } from './parse-data';

type Props = {
  userUuid: string;
  workspaceId: string;
  firstUuid: FileUuid;
  lastUuid: FileUuid;
};

export async function getBetweenUuids({ userUuid, workspaceId, firstUuid, lastUuid }: Props) {
  try {
    const items = await fileRepository.find({
      order: { uuid: 'ASC' },
      where: {
        userUuid,
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
