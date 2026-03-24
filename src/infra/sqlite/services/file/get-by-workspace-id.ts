import { logger } from '@/apps/shared/logger/logger';
import { SqliteError } from '../common/sqlite-error';
import { fileRepository } from '../drive-file';
import { parseData } from './parse-data';

type Props = {
  userUuid: string;
  workspaceId: string;
};

export async function getByWorkspaceId({ userUuid, workspaceId }: Props) {
  try {
    const items = await fileRepository.findBy({
      userUuid,
      workspaceId,
    });

    return { data: items.map((item) => parseData({ data: item })) };
  } catch (exc) {
    logger.error({
      msg: 'Error getting files by workspace id',
      workspaceId,
      exc,
    });

    return { error: new SqliteError('UNKNOWN', exc) };
  }
}
