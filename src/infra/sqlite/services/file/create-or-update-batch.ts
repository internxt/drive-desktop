import { DriveFile } from '@/apps/main/database/entities/DriveFile';
import { logger } from '@/apps/shared/logger/logger';
import { db } from '../../migrations/run-migrations';
import { SqliteError } from '../common/sqlite-error';
import { upsertQuery } from './queries';

const BATCH_SIZE = 100;

type Props = {
  files: DriveFile[];
};

export function createOrUpdateBatch({ files }: Props) {
  if (files.length === 0) return;

  try {
    const stmt = db.prepare(upsertQuery);

    for (let i = 0; i < files.length; i += BATCH_SIZE) {
      const chunk = files.slice(i, i + BATCH_SIZE);

      db.exec('BEGIN');
      for (const file of chunk) {
        stmt.run({
          id: file.id,
          uuid: file.uuid,
          status: file.status,
          plainName: file.plainName ?? '',
          type: file.type ?? '',
          createdAt: file.createdAt,
          updatedAt: file.updatedAt,
          folderUuid: file.folderUuid ?? '',
          workspaceId: file.workspaceId ?? '',
          fileId: file.fileId ?? '',
          size: file.size,
          folderId: file.folderId,
          userUuid: file.userUuid,
          modificationTime: file.modificationTime,
        });
      }
      db.exec('COMMIT');
    }
  } catch (error) {
    db.exec('ROLLBACK');
    logger.error({
      msg: 'Error batch creating or updating files',
      count: files.length,
      error,
    });

    return new SqliteError('UNKNOWN', error);
  }
}
