import { Result } from '@internxt/drive-desktop-core/build/common/result';
import { SimpleDriveFile } from '@/apps/main/database/entities/DriveFile';
import { logger } from '@/apps/shared/logger/logger';
import { db } from '../../migrations/run-migrations';
import { fileRowSchema } from '../common/item-row-schemas';
import { SqliteError } from '../common/sqlite-error';
import { parseData } from './parse-data';

type Props = {
  userUuid: string;
  workspaceId: string;
  uuids: string[];
};

/**
 * v2.7.2 Alexis Mora
 * Every status is returned because recovery sync compares remote items with their local row whatever its status.
 * The uuids are bound as one JSON array so a page of any size uses a single statement parameter.
 */
export function getFilesByUuids({ userUuid, workspaceId, uuids }: Props): Result<SimpleDriveFile[], SqliteError> {
  try {
    const rows = db
      .prepare(
        `SELECT * FROM drive_file
         WHERE userUuid = :userUuid
           AND workspaceId = :workspaceId
           AND uuid IN (SELECT value FROM json_each(:uuids))`,
      )
      .all({ userUuid, workspaceId, uuids: JSON.stringify(uuids) });

    const parsed = fileRowSchema.array().safeParse(rows);
    if (!parsed.success) return Result.err(new SqliteError('INVALID_ROW', parsed.error));

    return Result.ok(parsed.data.map((data) => parseData({ data })));
  } catch (error) {
    logger.error({ msg: 'Error getting files by uuids', count: uuids.length, error });
    return Result.err(new SqliteError('UNKNOWN', error));
  }
}
