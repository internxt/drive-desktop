import { RemoteSyncedFolder } from 'src/apps/main/remote-sync/helpers';
import { FolderUuid, SimpleDriveFolder } from '../../../../apps/main/database/entities/DriveFolder';

type TProps = {
  data: RemoteSyncedFolder;
};

export function parseData({ data }: TProps): SimpleDriveFolder {
  return {
    uuid: data.uuid as FolderUuid,
    name: data.plainName,
    parentId: data.parentId ?? undefined,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
    status: data.status,
  };
}
