import { DriveFile } from '@/apps/main/database/entities/DriveFile';
import { logger } from '@/apps/shared/logger/logger';
import { db } from '../../migrations/run-migrations';
import { parseData } from './parse-data';

const query = `
INSERT INTO drive_file (
  id,
  uuid,
  status,
  plainName,
  type,
  createdAt,
  updatedAt,
  folderUuid,
  workspaceId,
  fileId,
  size,
  folderId,
  userUuid,
  modificationTime
) VALUES (
  :id,
  :uuid,
  :status,
  :plainName,
  :type,
  :createdAt,
  :updatedAt,
  :folderUuid,
  :workspaceId,
  :fileId,
  :size,
  :folderId,
  :userUuid,
  :modificationTime
)
ON CONFLICT (uuid) DO UPDATE SET
  id = excluded.id,
  status = excluded.status,
  plainName = excluded.plainName,
  type = excluded.type,
  createdAt = excluded.createdAt,
  updatedAt = excluded.updatedAt,
  folderUuid = excluded.folderUuid,
  workspaceId = excluded.workspaceId,
  fileId = excluded.fileId,
  size = excluded.size,
  folderId = excluded.folderId,
  userUuid = excluded.userUuid,
  modificationTime = excluded.modificationTime;
`;

type Props = {
  file: DriveFile;
};

export function createOrUpdate({ file }: Props) {
  try {
    db.prepare(query).run({
      id: file.id,
      uuid: file.uuid,
      status: file.status,
      plainName: file.plainName ?? '',
      type: file.type ?? '',
      createdAt: file.createdAt,
      updatedAt: file.updatedAt,
      folderUuid: file.folderUuid ?? '',
      workspaceId: file.workspaceId ?? '',
      fileId: file.fileId ?? '',
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
