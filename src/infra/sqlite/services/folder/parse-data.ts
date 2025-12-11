import { RemoteSyncedFolder } from 'src/apps/main/remote-sync/helpers';
import { FolderUuid, SimpleDriveFolder } from '../../../../apps/main/database/entities/DriveFolder';
import { folderDecryptName } from '../../../../context/virtual-drive/folders/domain/folder-decrypt-name';

type TProps = {
  data:  RemoteSyncedFolder;
};

export function parseData({ data }: TProps): SimpleDriveFolder {
  const name = folderDecryptName({
    encryptedName: data.name,
    parentId: data.parentId ?? undefined,
    plainName: data.plainName,
  });

  return {
    uuid: data.uuid as FolderUuid,
    name,
    parentId: data.parentId ?? undefined,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
    status: data.status,
  };
}