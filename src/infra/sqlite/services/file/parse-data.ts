import { RemoteSyncedFile } from 'src/apps/main/remote-sync/helpers';
import { FileUuid, SimpleDriveFile, ContentsId } from '../../../../apps/main/database/entities/DriveFile';
import { fileDecryptName } from '../../../../context/virtual-drive/files/domain/file-decrypt-name';

type TProps = {
  data: RemoteSyncedFile;
};

export function parseData({ data }: TProps): SimpleDriveFile {
  const { name, nameWithExtension } = fileDecryptName({
    encryptedName: data.name,
    parentId: data.folderId,
    extension: data.type,
    plainName: data.plainName,
  });

  return {
    uuid: data.uuid as FileUuid,
    name,
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
