import { DriveFile, FileUuid, SimpleDriveFile } from '@/apps/main/database/entities/DriveFile';
import { fileDecryptName } from '@/context/virtual-drive/files/domain/file-decrypt-name';

type TProps = {
  data: DriveFile;
};

export function parseData({ data }: TProps) {
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
    parentUuid: data.folderUuid,
    contentsId: data.fileId,
    size: data.size,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  } satisfies SimpleDriveFile;
}
