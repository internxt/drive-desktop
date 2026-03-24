import { DriveFile } from '@/apps/main/database/entities/DriveFile';
import { logger } from '@/apps/shared/logger/logger';
import { fileRepository } from '../drive-file';
import { parseData } from './parse-data';

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
  } catch (error) {
    logger.error({ msg: 'Error creating or updating file', file, error });
  }
}
