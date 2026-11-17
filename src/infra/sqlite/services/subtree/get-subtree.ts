import { Result } from '@internxt/drive-desktop-core/build/common/result';
import { SimpleDriveFile } from '@/apps/main/database/entities/DriveFile';
import { SimpleDriveFolder } from '@/apps/main/database/entities/DriveFolder';
import { logger } from '@/apps/shared/logger/logger';
import { db } from '../../migrations/run-migrations';
import { DriveFile, DriveFolder } from '../../schema';
import { SqliteError } from '../common/sqlite-error';
import { parseData as parseFile } from '../file/parse-data';
import { parseData as parseFolder } from '../folder/parse-data';
import { FolderNode, walkSubtree } from './walk-subtree';

type Props = {
  userUuid: string;
  workspaceId: string;
  rootUuid: string;
  onlyExists?: boolean;
};

type Subtree = {
  files: SimpleDriveFile[];
  folders: SimpleDriveFolder[];
};

/**
 * v2.7.4 Victor Fernandez
 * The refresh and the backups only walk the tree under their root, but the database also holds every backup and every
 * deleted item, and loading all of it at once crashed the app with out of memory on big accounts.
 * The tree is walked in memory over a light list of folders because there is no index by parent, and a recursive query
 * was slower than loading everything on big backups. Then only the rows under the root are read, one by one, so the raw
 * rows are never all in memory next to the parsed ones.
 */
export function getSubtree({ userUuid, workspaceId, rootUuid, onlyExists = false }: Props): Result<Subtree, SqliteError> {
  try {
    const { folderUuids, parentUuids } = walkSubtree({ nodes: getFolderNodes({ userUuid, workspaceId }), rootUuid });
    const statusFilter = onlyExists ? "AND status = 'EXISTS'" : '';

    const files: SimpleDriveFile[] = [];
    const fileRows = db
      .prepare(
        `SELECT * FROM drive_file
         WHERE userUuid = :userUuid
           AND workspaceId = :workspaceId
           AND folderUuid IN (SELECT value FROM json_each(:uuids))
           ${statusFilter}`,
      )
      .iterate({ userUuid, workspaceId, uuids: JSON.stringify(parentUuids) });
    for (const row of fileRows) files.push(parseFile({ data: row as DriveFile }));

    const folders: SimpleDriveFolder[] = [];
    const folderRows = db
      .prepare(
        `SELECT * FROM drive_folder
         WHERE userUuid = :userUuid
           AND workspaceId = :workspaceId
           AND uuid IN (SELECT value FROM json_each(:uuids))
           ${statusFilter}`,
      )
      .iterate({ userUuid, workspaceId, uuids: JSON.stringify(folderUuids) });
    for (const row of folderRows) folders.push(parseFolder({ data: row as DriveFolder }));

    return Result.ok({ files, folders });
  } catch (error) {
    logger.error({ msg: 'Error getting subtree', workspaceId, rootUuid, error });
    return Result.err(new SqliteError('UNKNOWN', error));
  }
}

function getFolderNodes({ userUuid, workspaceId }: { userUuid: string; workspaceId: string }) {
  return db
    .prepare('SELECT uuid, parentUuid, status FROM drive_folder WHERE userUuid = :userUuid AND workspaceId = :workspaceId')
    .all({ userUuid, workspaceId }) as FolderNode[];
}
