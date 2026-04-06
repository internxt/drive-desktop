import { DriveFile } from '@/apps/main/database/entities/DriveFile';
import { logger } from '@/apps/shared/logger/logger';
import { db } from '../../migrations/run-migrations';
import { parseData } from './parse-data';
import { upsertQuery } from './queries';

type Props = {
  file: DriveFile;
};

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
    });

    return parseData({ data: file });
  } catch (error) {
    logger.error({ msg: 'Error creating or updating file', file, error });
  }
}
