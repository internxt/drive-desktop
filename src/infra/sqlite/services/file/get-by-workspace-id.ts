import { logger } from '@/apps/shared/logger/logger';
import { db } from '../../migrations/run-migrations';
import { DriveFile } from '../../schema';
import { SqliteError } from '../common/sqlite-error';
import { parseData } from './parse-data';

type Props = {
  userUuid: string;
  workspaceId: string;
};

export function getByWorkspaceId({ userUuid, workspaceId }: Props) {
  try {
    const items = db
      .prepare(`SELECT * FROM drive_file WHERE userUuid = :userUuid AND workspaceId = :workspaceId`)
      .all({ userUuid, workspaceId });

    return { data: items.map((item) => parseData({ data: item as DriveFile })) };
  } catch (exc) {
    logger.error({
      msg: 'Error getting files by workspaceId',
      workspaceId,
      exc,
    });

    return { error: new SqliteError('UNKNOWN', exc) };
  }
}
