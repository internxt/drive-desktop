import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';
import { logger } from '@/apps/shared/logger/logger';
import { db } from '../../migrations/run-migrations';
import { DriveFolder } from '../../schema';
import { SqliteError } from '../common/sqlite-error';
import { parseData } from './parse-data';

type Props = {
  userUuid: string;
  workspaceId: string;
  firstUuid: FolderUuid;
  lastUuid: FolderUuid;
};

export function getBetweenUuids({ userUuid, workspaceId, firstUuid, lastUuid }: Props) {
  try {
    const items = db
      .prepare(
        `SELECT * FROM drive_folder
         WHERE userUuid = :userUuid
           AND workspaceId = :workspaceId
           AND status = 'EXISTS'
           AND uuid >= :firstUuid
           AND uuid <= :lastUuid
         ORDER BY uuid ASC`,
      )
      .all({ userUuid, workspaceId, firstUuid, lastUuid });

    return { data: items.map((item) => parseData({ data: item as unknown as DriveFolder })) };
  } catch (error) {
    logger.error({
      msg: 'Error getting folders between uuids',
      error,
    });

    return { error: new SqliteError('UNKNOWN', error) };
  }
}
