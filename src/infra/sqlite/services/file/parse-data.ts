import { ContentsId, FileUuid, SimpleDriveFile } from '@/apps/main/database/entities/DriveFile';
import { DriveFile } from '../../schema';

type TProps = {
  data: DriveFile;
};

/**
 * Converts drive file data into a normalized simple drive file.
 *
 * @param data - The source drive file data
 * @returns The normalized drive file
 */
export function parseData({ data }: TProps): SimpleDriveFile {
  let name = data.plainName;
  if (data.type) name += `.${data.type}`;

  return {
    uuid: data.uuid as FileUuid,
    name,
    extension: data.type,
    parentId: data.folderId,
    parentUuid: data.folderUuid,
    contentsId: data.fileId as ContentsId,
    size: data.size,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
    creationTime: data.creationTime,
    modificationTime: data.modificationTime,
    status: data.status,
  };
}
