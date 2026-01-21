import { ContentsId, DriveFile, FileUuid, SimpleDriveFile } from '@/apps/main/database/entities/DriveFile';

type TProps = {
  data: DriveFile;
};

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
    modificationTime: data.modificationTime,
    status: data.status,
    isDangledStatus: data.isDangledStatus,
  };
}
