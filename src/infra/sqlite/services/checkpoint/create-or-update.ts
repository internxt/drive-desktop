import { logger } from '@/apps/shared/logger/logger';
import { db } from '../../migrations/run-migrations';
import { SqliteError } from '../common/sqlite-error';

type Props = {
  type: 'file' | 'folder';
  userUuid: string;
  workspaceId: string;
  name: string;
  updatedAt: string;
};

export function createOrUpdate(payload: Props) {
  try {
    logger.debug({ tag: 'SYNC-ENGINE', msg: 'Update checkpoint', payload });

    db.prepare(
      `INSERT INTO checkpoint (type, name, updatedAt, userUuid, workspaceId)
       VALUES (:type, :name, :updatedAt, :userUuid, :workspaceId)
       ON CONFLICT (type, userUuid, workspaceId) DO UPDATE SET
         name = excluded.name,
         updatedAt = excluded.updatedAt`,
    ).run(payload);
  } catch (error) {
    logger.error({
      tag: 'SYNC-ENGINE',
      msg: 'Error creating or updating checkpoint',
      payload,
      error,
    });

    return new SqliteError('UNKNOWN', error);
  }
}
