import { DriveFolder, FolderUuid, SimpleDriveFolder } from '@/apps/main/database/entities/DriveFolder';
import { folderDecryptName } from '@/context/virtual-drive/folders/domain/folder-decrypt-name';

type TProps = {
  data: DriveFolder;
};

export function parseData({ data }: TProps) {
  const name = folderDecryptName({
    encryptedName: data.name,
    parentId: data.parentId,
    plainName: data.plainName,
  });

  return {
    uuid: data.uuid as FolderUuid,
    name,
    parentUuid: data.parentUuid,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
    status: data.status,
  } satisfies SimpleDriveFolder;
}
