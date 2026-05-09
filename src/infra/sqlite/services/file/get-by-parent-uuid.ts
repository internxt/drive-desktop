import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';
import { logger } from '@/apps/shared/logger/logger';
import { db } from '../../migrations/run-migrations';
import { DriveFile } from '../../schema';
import { SqliteError } from '../common/sqlite-error';
import { parseData } from './parse-data';

export function getByParentUuid({ parentUuid }: { parentUuid: FolderUuid }) {
  try {
    const items = db.prepare(`SELECT * FROM drive_file WHERE folderUuid = :parentUuid AND status = 'EXISTS'`).all({ parentUuid });

    return { data: items.map((item) => parseData({ data: item as DriveFile })) };
  } catch (error) {
    logger.error({ msg: 'Error getting files by parentUuid', parentUuid, error });

    return { error: new SqliteError('UNKNOWN', error) };
  }
}
