import { LimitFunction } from 'p-limit';
import { SimpleDriveFile } from '@/apps/main/database/entities/DriveFile';
import { ExtendedDriveFolder, SimpleDriveFolder } from '@/apps/main/database/entities/DriveFolder';
import { SyncContext } from '@/apps/sync-engine/config';
import { deleteItemPlaceholder } from '@/backend/features/remote-sync/file-explorer/delete-item-placeholder';
import { updateFilePlaceholder } from '@/backend/features/remote-sync/file-explorer/update-file-placeholder';
import { updateFolderPlaceholder } from '@/backend/features/remote-sync/file-explorer/update-folder-placeholder';
import { FileExplorerFiles, FileExplorerFolders } from '@/backend/features/remote-sync/sync-items-by-checkpoint/load-in-memory-paths';
import { join } from '@/context/local/localFile/infrastructure/AbsolutePath';

type Database = { files: SimpleDriveFile[]; folders: SimpleDriveFolder[] };
type FileExplorer = { files: FileExplorerFiles; folders: FileExplorerFolders };

type Props = {
  ctx: SyncContext;
  database: Database;
  fileExplorer: FileExplorer;
  currentFolder: Pick<ExtendedDriveFolder, 'absolutePath' | 'uuid'>;
  isFirstExecution: boolean;
  limit: LimitFunction;
};
type StackItem =
  | { folder: Pick<ExtendedDriveFolder, 'absolutePath' | 'uuid'>; requiresPlaceholderUpdate: false }
  | { folder: ExtendedDriveFolder; requiresPlaceholderUpdate: true };
export async function traverse({ ctx, database, fileExplorer, currentFolder, isFirstExecution, limit }: Props) {
  const stack: StackItem[] = [{ folder: currentFolder, requiresPlaceholderUpdate: false }];

  while (stack.length > 0) {
    if (ctx.abortController.signal.aborted) return;

    const item = stack.pop();
    if (!item) return;

    if (item.requiresPlaceholderUpdate) {
      if (item.folder.status === 'DELETED' || item.folder.status === 'TRASHED') {
        await deleteItemPlaceholder({ ctx, type: 'folder', remote: item.folder, locals: fileExplorer.folders });
        continue;
      }

      const success = await updateFolderPlaceholder({ ctx, remote: item.folder, folders: fileExplorer.folders });
      if (!success || ctx.abortController.signal.aborted) continue;
    }

    const { folder } = item;
    const filesInThisFolder = database.files.filter((file) => file.parentUuid === folder.uuid);
    const foldersInThisFolder = database.folders.filter((child) => child.parentUuid === folder.uuid);

    await Promise.all(
      filesInThisFolder.map((file) =>
        limit(async () => {
          const absolutePath = join(folder.absolutePath, file.name);
          const remote = { ...file, absolutePath };

          if (file.status === 'DELETED' || file.status === 'TRASHED') {
            await deleteItemPlaceholder({ ctx, type: 'file', remote, locals: fileExplorer.files });
          } else {
            await updateFilePlaceholder({ ctx, remote, files: fileExplorer.files, isFirstExecution });
          }
        }),
      ),
    );

    for (let index = foldersInThisFolder.length - 1; index >= 0; index -= 1) {
      const child = foldersInThisFolder[index];
      const absolutePath = join(folder.absolutePath, child.name);
      stack.push({ folder: { ...child, absolutePath }, requiresPlaceholderUpdate: true });
    }
  }
}
