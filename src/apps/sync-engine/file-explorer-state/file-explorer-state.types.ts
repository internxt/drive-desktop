import { FileUuid, SimpleDriveFile } from '@/apps/main/database/entities/DriveFile';
import { AbsolutePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { Stats } from 'node:fs';

export type PendingFileExplorerItem = { path: AbsolutePath; stats: Stats };
export type FileExplorerFile = PendingFileExplorerItem & { uuid: FileUuid };
export type FileExplorerState = {
  createFiles: PendingFileExplorerItem[];
  createFolders: PendingFileExplorerItem[];
  modifiedFiles: FileExplorerFile[];
};

export type RemoteFilesMap = Record<FileUuid, SimpleDriveFile>;
