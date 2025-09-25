import { FileUuid, SimpleDriveFile } from '@/apps/main/database/entities/DriveFile';
import { AbsolutePath, RelativePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { Stats } from 'fs';

export type PendingFileExplorerItem = { path: RelativePath; absolutePath: AbsolutePath; stats: Stats };
export type FileExplorerFile = PendingFileExplorerItem & { uuid: FileUuid };
export type FileExplorerState = {
  createFiles: PendingFileExplorerItem[];
  createFolders: PendingFileExplorerItem[];
  hydrateFiles: FileExplorerFile[];
  modifiedFiles: FileExplorerFile[];
};

export type RemoteFilesMap = Record<FileUuid, SimpleDriveFile>;
