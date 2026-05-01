import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';
import { logger } from '@/apps/shared/logger/logger';
import { db } from '../../migrations/run-migrations';
import { DriveFolder } from '../../schema';
import { SingleItemError } from '../common/single-item-error';

type Props = {
  uuid: FolderUuid;
  payload: {
    status: DriveFolder['status'];
  };
};

export function updateByUuid({ uuid, payload }: Props) {
  try {
    const result = db.prepare(`UPDATE drive_folder SET status = :status WHERE uuid = :uuid`).run({ uuid, status: payload.status });

    if (!result.changes) {
      return { error: new SingleItemError('NOT_FOUND') };
    }

    return { data: result.changes };
  } catch (exc) {
    logger.error({
      msg: 'Error updating folder by uuid',
      uuid,
      payload,
      exc,
    });

    return { error: new SingleItemError('UNKNOWN', exc) };
  }
}
