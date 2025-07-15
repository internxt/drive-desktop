import { DriveFolder, FolderUuid, SimpleDriveFolder } from '@/apps/main/database/entities/DriveFolder';
import { Folder } from '@/context/virtual-drive/folders/domain/Folder';

type TProps = {
  data: DriveFolder;
};

export function parseData({ data }: TProps) {
  const name = Folder.decryptName({
    name: data.name,
    parentId: data.parentId,
    plainName: data.plainName,
  });

  return {
    id: data.id,
    uuid: data.uuid as FolderUuid,
    name,
    parentUuid: data.parentUuid,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
    status: data.status,
  } satisfies SimpleDriveFolder;
}
