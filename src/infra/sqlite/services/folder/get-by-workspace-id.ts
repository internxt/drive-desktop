import { logger } from '@/apps/shared/logger/logger';
import { parseData } from './parse-data';
import { SqliteError } from '../common/sqlite-error';
import { folderRepository } from '../drive-folder';

type Props = {
  userUuid: string;
  workspaceId: string;
};

export async function getByWorkspaceId({ userUuid, workspaceId }: Props) {
  try {
    const items = await folderRepository.findBy({
      userUuid,
      workspaceId,
    });

    return { data: items.map((item) => parseData({ data: item })) };
  } catch (exc) {
    logger.error({
      msg: 'Error getting folders by workspace id',
      workspaceId,
      exc,
    });

    return { error: new SqliteError('UNKNOWN', exc) };
  }
}
