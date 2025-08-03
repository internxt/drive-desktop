import { FileUuid } from '@/apps/main/database/entities/DriveFile';
import { driveServerWip } from '../drive-server-wip.module';
import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';

export type FromProcess = {
  storageDeleteFileByUuid: (props: {
    uuid: FileUuid;
    workspaceToken: string;
    nameWithExtension: string;
  }) => Awaited<ReturnType<typeof driveServerWip.storage.deleteFileByUuid>>;
  storageDeleteFolderByUuid: (props: {
    uuid: FolderUuid;
    workspaceToken: string;
    name: string;
  }) => Awaited<ReturnType<typeof driveServerWip.storage.deleteFolderByUuid>>;
  renameFileByUuid: (props: {
    uuid: FileUuid;
    workspaceToken: string;
    nameWithExtension: string;
  }) => Awaited<ReturnType<typeof driveServerWip.files.renameFile>>;
  renameFolderByUuid: (props: {
    uuid: FolderUuid;
    workspaceToken: string;
    name: string;
  }) => Awaited<ReturnType<typeof driveServerWip.folders.renameFolder>>;
  moveFileByUuid: (props: {
    uuid: FileUuid;
    workspaceToken: string;
    parentUuid: FolderUuid;
    nameWithExtension: string;
  }) => Awaited<ReturnType<typeof driveServerWip.files.moveFile>>;
  moveFolderByUuid: (props: {
    uuid: FolderUuid;
    workspaceToken: string;
    parentUuid: FolderUuid;
    name: string;
  }) => Awaited<ReturnType<typeof driveServerWip.folders.moveFolder>>;
};

export type FromMain = {};
