import { fileRepository } from '../drive-file';
import { logger } from '@/apps/shared/logger/logger';
import { parseData } from './parse-data';
import { SqliteError } from '../common/sqlite-error';
import { Between } from 'typeorm';
import { FileUuid } from '@/apps/main/database/entities/DriveFile';

type Props = {
  workspaceId: string;
  from: FileUuid;
  to: FileUuid;
};

export async function getBetweenUuids({ workspaceId, from, to }: Props) {
  try {
    const items = await fileRepository.find({
      where: { workspaceId, uuid: Between(from, to) },
      order: { updatedAt: 'ASC' },
    });

    return { data: items.map((item) => parseData({ data: item })) };
  } catch (error) {
    logger.error({
      msg: 'Error getting files between uuids',
      from,
      to,
      error,
    });

    return { error: new SqliteError('UNKNOWN', error) };
  }
}
