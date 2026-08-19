import { logger } from '@/apps/shared/logger/logger';
import { db } from '../../migrations/run-migrations';
import { DriveFile } from '../../schema';
import { parseData } from './parse-data';
import { upsertQuery } from './queries';

type Props = {
  file: DriveFile;
};

/**
 * Creates or updates a stored file record.
 *
 * @param file - The file record to persist
 * @returns The parsed file data, or `undefined` if persistence or parsing fails
 */
export function createOrUpdate({ file }: Props) {
  try {
    db.prepare(upsertQuery).run({
      id: file.id,
      uuid: file.uuid,
      status: file.status,
      plainName: file.plainName ?? '',
      type: file.type ?? '',
      createdAt: file.createdAt,
      updatedAt: file.updatedAt,
      folderUuid: file.folderUuid ?? '',
      workspaceId: file.workspaceId ?? '',
      fileId: file.fileId,
      size: file.size,
      folderId: file.folderId,
      userUuid: file.userUuid,
      modificationTime: file.modificationTime,
      creationTime: file.creationTime,
    });

    return parseData({ data: file });
  } catch (error) {
    logger.error({ msg: 'Error creating or updating file', file, error });
  }
}
