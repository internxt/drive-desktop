import { logger } from '@/apps/shared/logger/logger';
import { db } from '../../migrations/run-migrations';
import { DriveFolder } from '../../schema';
import { SqliteError } from '../common/sqlite-error';
import { upsertQuery } from './queries';

const BATCH_SIZE = 100;

type Props = {
  folders: DriveFolder[];
};

export function createOrUpdateBatch({ folders }: Props) {
  if (folders.length === 0) return;

  try {
    const stmt = db.prepare(upsertQuery);

    for (let i = 0; i < folders.length; i += BATCH_SIZE) {
      const chunk = folders.slice(i, i + BATCH_SIZE);

      db.exec('BEGIN');
      for (const folder of chunk) {
        stmt.run({
          uuid: folder.uuid,
          id: folder.id,
          workspaceId: folder.workspaceId ?? '',
          parentId: folder.parentId ?? '',
          parentUuid: folder.parentUuid ?? '',
          userUuid: folder.userUuid,
          createdAt: folder.createdAt,
          updatedAt: folder.updatedAt,
          plainName: folder.plainName ?? '',
          status: folder.status,
        });
      }
      db.exec('COMMIT');
    }
  } catch (error) {
    db.exec('ROLLBACK');
    logger.error({
      msg: 'Error batch creating or updating folders',
      count: folders.length,
      error,
    });

    return new SqliteError('UNKNOWN', error);
  }
}
