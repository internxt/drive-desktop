import { logger } from '@/apps/shared/logger/logger';
import { parseData } from './parse-data';
import { DriveFolder } from '@/apps/main/database/entities/DriveFolder';
import { folderRepository } from '../drive-folder';

type Props = {
  folder: DriveFolder;
};

export async function createOrUpdate({ folder }: Props) {
  try {
    await folderRepository.upsert(folder, {
      conflictPaths: ['uuid'],
      skipUpdateIfNoValuesChanged: true,
    });

    return parseData({ data: folder });
  } catch (exc) {
    logger.error({ msg: 'Error creating or updating folder', folder, exc });
    return;
  }
}
