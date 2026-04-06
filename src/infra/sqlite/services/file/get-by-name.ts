import { basename, extname } from 'node:path';
import { DriveFile } from '@/apps/main/database/entities/DriveFile';
import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';
import { logger } from '@/apps/shared/logger/logger';
import { db } from '../../migrations/run-migrations';
import { SingleItemError } from '../common/single-item-error';
import { parseData } from './parse-data';

type Props = {
  parentUuid: FolderUuid;
  nameWithExtension: string;
};

export function getByName({ parentUuid, nameWithExtension }: Props) {
  try {
    const extension = extname(nameWithExtension);
    const plainName = basename(nameWithExtension, extension);

    const data = db
      .prepare(
        `SELECT * FROM drive_file
         WHERE folderUuid = :folderUuid
           AND plainName = :plainName
           AND type = :type
           AND status = 'EXISTS'
         LIMIT 1`,
      )
      .get({ folderUuid: parentUuid, plainName, type: extension.slice(1) });

    if (data) return { data: parseData({ data: data as unknown as DriveFile }) };
    return { error: new SingleItemError('NOT_FOUND') };
  } catch (exc) {
    logger.error({
      msg: 'Error getting file by name',
      parentUuid,
      nameWithExtension,
      exc,
    });

    return { error: new SingleItemError('UNKNOWN', exc) };
  }
}
