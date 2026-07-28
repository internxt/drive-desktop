import { SimpleDriveFolder } from '@/apps/main/database/entities/DriveFolder';
import { logger } from '@/apps/shared/logger/logger';
import { db } from '../../migrations/run-migrations';
import { DriveFolder } from '../../schema';
import { SqliteError } from '../common/sqlite-error';
import { parseData } from './parse-data';

type Props = {
  userUuid: string;
  workspaceId: string;
  folderStatus?: SimpleDriveFolder['status'];
};

export function getByWorkspaceId({ userUuid, workspaceId, folderStatus }: Props) {
  try {
    const statusFilter = folderStatus ? 'AND status = :folderStatus' : '';
    const query = `
      SELECT * FROM drive_folder
      WHERE userUuid = :userUuid
        AND workspaceId = :workspaceId
        ${statusFilter}
    `;
    const params: Record<string, string> = { userUuid, workspaceId };
    if (folderStatus) {
      params.folderStatus = folderStatus;
    }

    const items = db.prepare(query).all(params);

    return { data: items.map((item) => parseData({ data: item as DriveFolder })) };
  } catch (exc) {
    logger.error({
      msg: 'Error getting folders by workspace id',
      workspaceId,
      exc,
    });

    return { error: new SqliteError('UNKNOWN', exc) };
  }
}
