import { fileRepository } from '../drive-file';
import { logger } from '@/apps/shared/logger/logger';
import { parseData } from './parse-data';
import { SqliteError } from '../common/sqlite-error';
import { Between } from 'typeorm';

type Props = {
  workspaceId: string;
  firstId: number;
  lastId: number;
};

export async function getBetweenIds({ workspaceId, firstId, lastId }: Props) {
  try {
    const items = await fileRepository.find({
      order: { id: 'ASC' },
      where: {
        workspaceId,
        status: 'EXISTS',
        id: Between(firstId, lastId),
      },
    });

    return { data: items.map((item) => parseData({ data: item })) };
  } catch (error) {
    logger.error({
      msg: 'Error getting files between ids',
      error,
    });

    return { error: new SqliteError('UNKNOWN', error) };
  }
}
