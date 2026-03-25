import { DriveFolder } from '@/apps/main/database/entities/DriveFolder';
import { logger } from '@/apps/shared/logger/logger';
import { folderRepository } from '../drive-folder';
import { parseData } from './parse-data';

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
  } catch (error) {
    logger.error({ msg: 'Error creating or updating folder', folder, error });
  }
}
