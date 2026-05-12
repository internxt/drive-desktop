import { LimitFunction } from 'p-limit';
import { SimpleDriveFile } from '@/apps/main/database/entities/DriveFile';
import { ExtendedDriveFolder, SimpleDriveFolder } from '@/apps/main/database/entities/DriveFolder';
import { ProcessSyncContext } from '@/apps/sync-engine/config';
import { deleteItemPlaceholder } from '@/backend/features/remote-sync/file-explorer/delete-item-placeholder';
import { updateFilePlaceholder } from '@/backend/features/remote-sync/file-explorer/update-file-placeholder';
import { updateFolderPlaceholder } from '@/backend/features/remote-sync/file-explorer/update-folder-placeholder';
import { join } from '@/context/local/localFile/infrastructure/AbsolutePath';

type Database = { files: SimpleDriveFile[]; folders: SimpleDriveFolder[] };

type Props = {
  ctx: ProcessSyncContext;
  database: Database;
  currentFolder: Pick<ExtendedDriveFolder, 'absolutePath' | 'uuid'>;
  isFirstExecution: boolean;
  limit: LimitFunction;
};

export async function traverse({ ctx, database, currentFolder, isFirstExecution, limit }: Props) {
  if (ctx.abortController.signal.aborted) return;

  const filesInThisFolder = database.files.filter((file) => file.parentUuid === currentFolder.uuid);
  const foldersInThisFolder = database.folders.filter((folder) => folder.parentUuid === currentFolder.uuid);

  await Promise.all(
    filesInThisFolder.map((file) =>
      limit(async () => {
        const absolutePath = join(currentFolder.absolutePath, file.name);
        const remote = { ...file, absolutePath };

        if (file.status === 'DELETED' || file.status === 'TRASHED') {
          await deleteItemPlaceholder({ ctx, type: 'file', remote });
        } else {
          await updateFilePlaceholder({ ctx, remote, isFirstExecution });
        }
      }),
    ),
  );

  for (const folder of foldersInThisFolder) {
    const absolutePath = join(currentFolder.absolutePath, folder.name);
    const remote = { ...folder, absolutePath };

    if (folder.status === 'DELETED' || folder.status === 'TRASHED') {
      await deleteItemPlaceholder({ ctx, type: 'folder', remote });
    } else {
      const success = await updateFolderPlaceholder({ ctx, remote });
      if (success) {
        await traverse({ ctx, database, currentFolder: remote, isFirstExecution, limit });
      }
    }
  }
}
