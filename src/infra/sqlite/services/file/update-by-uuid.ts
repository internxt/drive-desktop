import { FileUuid } from '@/apps/main/database/entities/DriveFile';
import { logger } from '@/apps/shared/logger/logger';
import { db } from '../../migrations/run-migrations';
import { DriveFile } from '../../schema';
import { SingleItemError } from '../common/single-item-error';

type Props = {
  uuid: FileUuid;
  payload: {
    status?: DriveFile['status'];
  };
};

export function updateByUuid({ uuid, payload }: Props) {
  try {
    const result = db.prepare(`UPDATE drive_file SET status = :status WHERE uuid = :uuid`).run({ uuid, status: payload.status ?? null });

    if (!result.changes) {
      return { error: new SingleItemError('NOT_FOUND') };
    }

    return { data: result.changes };
  } catch (exc) {
    logger.error({
      msg: 'Error updating file by uuid',
      uuid,
      payload,
      exc,
    });

    return { error: new SingleItemError('UNKNOWN', exc) };
  }
}
