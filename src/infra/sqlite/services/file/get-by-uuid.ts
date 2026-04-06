import { logger } from '@/apps/shared/logger/logger';
import { db } from '../../migrations/run-migrations';
import { DriveFile } from '../../schema';
import { SingleItemError } from '../common/single-item-error';
import { parseData } from './parse-data';

type Props = {
  uuid: string;
};

export function getByUuid({ uuid }: Props) {
  try {
    const data = db.prepare(`SELECT * FROM drive_file WHERE uuid = :uuid LIMIT 1`).get({ uuid });

    if (data) return { data: parseData({ data: data as DriveFile }) };

    return { error: new SingleItemError('NOT_FOUND') };
  } catch (exc) {
    logger.error({
      msg: 'Error getting file by uuid',
      uuid,
      exc,
    });

    return { error: new SingleItemError('UNKNOWN', exc) };
  }
}
