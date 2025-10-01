import { fileRepository } from '../drive-file';
import { logger } from '@/apps/shared/logger/logger';
import { parseData } from './parse-data';
import { SqliteError } from '../common/sqlite-error';

type Props = {
  workspaceId: string;
  status: 'EXISTS' | 'TRASHED' | 'DELETED';
};

export async function getByStatus({ workspaceId, status }: Props) {
  try {
    const items = await fileRepository.find({
      where: { workspaceId, status },
      order: { updatedAt: 'ASC' },
    });

    return { data: items.map((item) => parseData({ data: item })) };
  } catch (error) {
    logger.error({
      msg: 'Error getting files by status',
      error,
    });

    return { error: new SqliteError('UNKNOWN', error) };
  }
}
