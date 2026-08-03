import { SimpleDriveFile } from '@/apps/main/database/entities/DriveFile';
import { logger } from '@/apps/shared/logger/logger';
import { db } from '../../migrations/run-migrations';
import { DriveFile } from '../../schema';
import { SqliteError } from '../common/sqlite-error';
import { parseData } from './parse-data';

type Props = {
  userUuid: string;
  workspaceId: string;
  fileStatus?: SimpleDriveFile['status'];
};

export function getByWorkspaceId({ userUuid, workspaceId, fileStatus }: Props) {
  try {
    const statusFilter = fileStatus ? 'AND status = :fileStatus' : '';
    const query = `
      SELECT * FROM drive_file
      WHERE userUuid = :userUuid
        AND workspaceId = :workspaceId
        ${statusFilter}
    `;
    const params: Record<string, string> = { userUuid, workspaceId };
    if (fileStatus) {
      params.fileStatus = fileStatus;
    }

    const items = db.prepare(query).all(params);

    return { data: items.map((item) => parseData({ data: item as DriveFile })) };
  } catch (exc) {
    logger.error({
      msg: 'Error getting files by workspace id',
      workspaceId,
      exc,
    });

    return { error: new SqliteError('UNKNOWN', exc) };
  }
}
