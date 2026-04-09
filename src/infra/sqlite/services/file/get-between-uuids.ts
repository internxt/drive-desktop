import { DriveFile, FileUuid } from '@/apps/main/database/entities/DriveFile';
import { logger } from '@/apps/shared/logger/logger';
import { db } from '../../migrations/run-migrations';
import { SqliteError } from '../common/sqlite-error';
import { parseData } from './parse-data';

type Props = {
  userUuid: string;
  workspaceId: string;
  firstUuid: FileUuid;
  lastUuid: FileUuid;
};

export function getBetweenUuids({ userUuid, workspaceId, firstUuid, lastUuid }: Props) {
  try {
    const items = db
      .prepare(
        `SELECT * FROM drive_file
         WHERE userUuid = :userUuid
           AND workspaceId = :workspaceId
           AND status = 'EXISTS'
           AND uuid >= :firstUuid
           AND uuid <= :lastUuid
         ORDER BY uuid ASC`,
      )
      .all({ userUuid, workspaceId, firstUuid, lastUuid });

    return { data: items.map((item) => parseData({ data: item as unknown as DriveFile })) };
  } catch (error) {
    logger.error({
      msg: 'Error getting files between uuids',
      error,
    });

    return { error: new SqliteError('UNKNOWN', error) };
  }
}
