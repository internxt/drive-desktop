import { join } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { SimpleDriveFile } from '@/apps/main/database/entities/DriveFile';
import { ExtendedDriveFolder, SimpleDriveFolder } from '@/apps/main/database/entities/DriveFolder';
import { ProcessSyncContext } from '@/apps/sync-engine/config';
import { FilePlaceholderUpdater } from '@/backend/features/remote-sync/file-explorer/update-file-placeholder';
import { FolderPlaceholderUpdater } from '@/backend/features/remote-sync/file-explorer/update-folder-placeholder';
import { FileExplorerFiles, FileExplorerFolders } from '@/backend/features/remote-sync/sync-items-by-checkpoint/load-in-memory-paths';
import { deleteItemPlaceholder } from '@/backend/features/remote-sync/file-explorer/delete-item-placeholder';
import { checkDangledFiles } from '@/apps/sync-engine/dangled-files/check-dangled-files';

type Database = { files: SimpleDriveFile[]; folders: SimpleDriveFolder[] };
type FileExplorer = { files: FileExplorerFiles; folders: FileExplorerFolders };

type Props = {
  ctx: ProcessSyncContext;
  database: Database;
  fileExplorer: FileExplorer;
  currentFolder: Pick<ExtendedDriveFolder, 'absolutePath' | 'uuid'>;
  isFirstExecution: boolean;
};

export async function traverse({ ctx, database, fileExplorer, currentFolder, isFirstExecution }: Props) {
  if (ctx.abortController.signal.aborted) return;

  const filesInThisFolder = database.files.filter((file) => file.parentUuid === currentFolder.uuid);
  const foldersInThisFolder = database.folders.filter((folder) => folder.parentUuid === currentFolder.uuid);

  const filePromises = filesInThisFolder.map(async (file) => {
    const absolutePath = join(currentFolder.absolutePath, file.name);
    const remote = { ...file, absolutePath };

    if (file.status === 'DELETED' || file.status === 'TRASHED') {
      await deleteItemPlaceholder({ ctx, type: 'file', remote, locals: fileExplorer.files });
    } else {
      await FilePlaceholderUpdater.update({ ctx, remote, files: fileExplorer.files, isFirstExecution });
      if (isFirstExecution) {
        void checkDangledFiles({ ctx, file: remote });
      }
    }
  });

  const folderPromises = foldersInThisFolder.map(async (folder) => {
    const absolutePath = join(currentFolder.absolutePath, folder.name);
    const remote = { ...folder, absolutePath };

    if (folder.status === 'DELETED' || folder.status === 'TRASHED') {
      await deleteItemPlaceholder({ ctx, type: 'folder', remote, locals: fileExplorer.folders });
    } else {
      const success = await FolderPlaceholderUpdater.update({ ctx, remote, folders: fileExplorer.folders });
      if (success) {
        await traverse({ ctx, database, fileExplorer, currentFolder: remote, isFirstExecution });
      }
    }
  });

  await Promise.all(filePromises.concat(folderPromises));
}
