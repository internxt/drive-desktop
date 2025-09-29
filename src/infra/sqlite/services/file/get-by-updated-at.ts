import { fileRepository } from '../drive-file';
import { logger } from '@/apps/shared/logger/logger';
import { parseData } from './parse-data';
import { SqliteError } from '../common/sqlite-error';
import { Between } from 'typeorm';

type Props = {
  workspaceId: string;
  from: string;
  to: string;
};

export async function getByUpdatedAt({ workspaceId, from, to }: Props) {
  try {
    const items = await fileRepository.findBy({
      workspaceId,
      updatedAt: Between(from, to),
    });

    return { data: items.map((item) => parseData({ data: item })) };
  } catch (error) {
    logger.error({
      msg: 'Error getting files by updated at',
      from,
      to,
      error,
    });

    return { error: new SqliteError('UNKNOWN', error) };
  }
}
