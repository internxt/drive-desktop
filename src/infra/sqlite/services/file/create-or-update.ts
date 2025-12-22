import { fileRepository } from '../drive-file';
import { logger } from '@/apps/shared/logger/logger';
import { parseData } from './parse-data';
import { DriveFile } from '@/apps/main/database/entities/DriveFile';

type Props = {
  file: DriveFile;
};

export async function createOrUpdate({ file }: Props) {
  try {
    await fileRepository.upsert(file, {
      conflictPaths: ['uuid'],
      skipUpdateIfNoValuesChanged: true,
    });

    return parseData({ data: file });
  } catch (exc) {
    logger.error({ msg: 'Error creating or updating file', file, exc });
    return;
  }
}
