import { logger } from '@/apps/shared/logger/logger';
import { db } from '../../migrations/run-migrations';
import { DriveFolder } from '../../schema';
import { SqliteError } from '../common/sqlite-error';
import { parseData } from './parse-data';

type Props = {
  userUuid: string;
  workspaceId: string;
};

export function getByWorkspaceId({ userUuid, workspaceId }: Props) {
  try {
    const items = db
      .prepare(`SELECT * FROM drive_folder WHERE userUuid = :userUuid AND workspaceId = :workspaceId`)
      .all({ userUuid, workspaceId });

    return { data: items.map((item) => parseData({ data: item as unknown as DriveFolder })) };
  } catch (exc) {
    logger.error({
      msg: 'Error getting folders by workspace id',
      workspaceId,
      exc,
    });

    return { error: new SqliteError('UNKNOWN', exc) };
  }
}
