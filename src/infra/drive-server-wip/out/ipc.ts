import { FileUuid } from '@/apps/main/database/entities/DriveFile';
import { driveServerWip } from '../drive-server-wip.module';
import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';

export type FromProcess = {
  storageDeleteFileByUuid: (props: {
    uuid: FileUuid;
    workspaceToken: string;
    path: string;
  }) => Awaited<ReturnType<typeof driveServerWip.storage.deleteFileByUuid>>;
  storageDeleteFolderByUuid: (props: {
    uuid: FolderUuid;
    workspaceToken: string;
    path: string;
  }) => Awaited<ReturnType<typeof driveServerWip.storage.deleteFolderByUuid>>;
  moveFileByUuid: (props: {
    uuid: FileUuid;
    workspaceToken: string;
    parentUuid: FolderUuid;
    path: string;
  }) => Awaited<ReturnType<typeof driveServerWip.files.move>>;
  moveFolderByUuid: (props: {
    uuid: FolderUuid;
    workspaceToken: string;
    parentUuid: FolderUuid;
    path: string;
  }) => Awaited<ReturnType<typeof driveServerWip.folders.move>>;
};

export type FromMain = {};
