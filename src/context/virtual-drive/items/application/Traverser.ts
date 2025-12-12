import { join } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { SimpleDriveFile } from '@/apps/main/database/entities/DriveFile';
import { ExtendedDriveFolder, SimpleDriveFolder } from '@/apps/main/database/entities/DriveFolder';
import { ProcessSyncContext } from '@/apps/sync-engine/config';
import { FilePlaceholderUpdater } from '@/backend/features/remote-sync/file-explorer/update-file-placeholder';
import { FolderPlaceholderUpdater } from '@/backend/features/remote-sync/file-explorer/update-folder-placeholder';
import { InMemoryFiles, InMemoryFolders } from '@/backend/features/remote-sync/sync-items-by-checkpoint/load-in-memory-paths';
import { deleteItemPlaceholder } from '@/backend/features/remote-sync/file-explorer/delete-item-placeholder';
import { checkDangledFiles } from '@/apps/sync-engine/dangled-files/check-dangled-files';

type Items = {
  files: Array<SimpleDriveFile>;
  folders: Array<SimpleDriveFolder>;
};

type Props = {
  ctx: ProcessSyncContext;
  items: Items;
  files: InMemoryFiles;
  folders: InMemoryFolders;
  currentFolder: Pick<ExtendedDriveFolder, 'absolutePath' | 'uuid'>;
  runDangledFiles: boolean;
};

export class Traverser {
  static async run({ ctx, items, files, folders, currentFolder, runDangledFiles }: Props) {
    const filesInThisFolder = items.files.filter((file) => file.parentUuid === currentFolder.uuid);
    const foldersInThisFolder = items.folders.filter((folder) => folder.parentUuid === currentFolder.uuid);

    const filePromises = filesInThisFolder.map(async (file) => {
      const absolutePath = join(currentFolder.absolutePath, file.nameWithExtension);
      const remote = { ...file, absolutePath };

      if (file.status === 'DELETED' || file.status === 'TRASHED') {
        await deleteItemPlaceholder({ ctx, type: 'file', remote, locals: files });
      } else {
        await FilePlaceholderUpdater.update({ ctx, remote, files });
        if (runDangledFiles) {
          void checkDangledFiles({ ctx, file: remote });
        }
      }
    });

    const folderPromises = foldersInThisFolder.map(async (folder) => {
      const absolutePath = join(currentFolder.absolutePath, folder.name);
      const remote = { ...folder, absolutePath };

      if (folder.status === 'DELETED' || folder.status === 'TRASHED') {
        await deleteItemPlaceholder({ ctx, type: 'folder', remote, locals: folders });
      } else {
        const success = await FolderPlaceholderUpdater.update({ ctx, remote, folders });
        if (success) {
          await this.run({ ctx, items, files, folders, currentFolder: remote, runDangledFiles });
        }
      }
    });

    await Promise.all([filePromises, folderPromises]);
  }
}
