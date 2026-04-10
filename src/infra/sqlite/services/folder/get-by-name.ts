import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';
import { logger } from '@/apps/shared/logger/logger';
import { db } from '../../migrations/run-migrations';
import { DriveFolder } from '../../schema';
import { SingleItemError } from '../common/single-item-error';
import { parseData } from './parse-data';

type Props = {
  parentUuid: FolderUuid;
  plainName: string;
};

export function getByName({ parentUuid, plainName }: Props) {
  try {
    const data = db
      .prepare(
        `SELECT * FROM drive_folder
         WHERE parentUuid = :parentUuid
           AND plainName = :plainName
           AND status = 'EXISTS'
         LIMIT 1`,
      )
      .get({ parentUuid, plainName });

    if (data) return { data: parseData({ data: data as unknown as DriveFolder }) };
    return { error: new SingleItemError('NOT_FOUND') };
  } catch (exc) {
    logger.error({
      msg: 'Error getting folder by name',
      parentUuid,
      plainName,
      exc,
    });

    return { error: new SingleItemError('UNKNOWN', exc) };
  }
}
