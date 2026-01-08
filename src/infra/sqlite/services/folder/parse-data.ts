import { DriveFolder, FolderUuid, SimpleDriveFolder } from '@/apps/main/database/entities/DriveFolder';

type TProps = {
  data: DriveFolder;
};

export function parseData({ data }: TProps): SimpleDriveFolder {
  return {
    uuid: data.uuid as FolderUuid,
    name: data.plainName,
    parentUuid: data.parentUuid,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
    status: data.status,
  };
}
