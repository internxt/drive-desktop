import { logger } from '@/apps/shared/logger/logger';
import { db } from '../../migrations/run-migrations';
import { DriveFolder } from '../../schema';
import { SingleItemError } from '../common/single-item-error';
import { parseData } from './parse-data';

type Props = {
  uuid: string;
};

export function getByUuid({ uuid }: Props) {
  try {
    const data = db.prepare(`SELECT * FROM drive_folder WHERE uuid = :uuid LIMIT 1`).get({ uuid });

    if (data) return { data: parseData({ data: data as unknown as DriveFolder }) };

    return { error: new SingleItemError('NOT_FOUND') };
  } catch (exc) {
    logger.error({
      msg: 'Error getting folder by uuid',
      uuid,
      exc,
    });

    return { error: new SingleItemError('UNKNOWN', exc) };
  }
}
