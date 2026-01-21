import { RemoteSyncedFile } from 'src/apps/main/remote-sync/helpers';
import { FileUuid, SimpleDriveFile, ContentsId } from '../../../../apps/main/database/entities/DriveFile';

type TProps = {
  data: RemoteSyncedFile;
};

export function parseData({ data }: TProps): SimpleDriveFile {
  const nameWithExtension = data.type ? `${data.plainName}.${data.type}` : data.plainName;

  return {
    uuid: data.uuid as FileUuid,
    name: data.plainName,
    nameWithExtension,
    extension: data.type,
    parentId: data.folderId,
    parentUuid: data.folderUuid,
    contentsId: data.fileId as ContentsId,
    size: data.size,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
    modificationTime: data.modificationTime,
    status: data.status,
  };
}
