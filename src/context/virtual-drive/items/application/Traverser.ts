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
type DatabaseChildrenIndex = {
  filesByParentUuid: Map<string | undefined, SimpleDriveFile[]>;
  foldersByParentUuid: Map<string | undefined, SimpleDriveFolder[]>;
};

export async function traverse({ ctx, database, fileExplorer, currentFolder, isFirstExecution, limit }: Props) {
  const { filesByParentUuid, foldersByParentUuid } = indexDatabaseChildren(database);
  const stack: StackItem[] = [{ folder: currentFolder, requiresPlaceholderUpdate: false }];

  while (stack.length > 0) {
    if (ctx.abortController.signal.aborted) return;

    const item = stack.pop();
    if (!item) return;

    const canTraverseFolder = await processFolderPlaceHolder({ ctx, item, fileExplorer });
    if (!canTraverseFolder) continue;

    const { folder } = item;
    const filesInThisFolder = filesByParentUuid.get(folder.uuid);
    const foldersInThisFolder = foldersByParentUuid.get(folder.uuid);

    if (filesInThisFolder && filesInThisFolder.length > 0) {
      await processFilesInFolder({ ctx, folder, files: filesInThisFolder, fileExplorer, isFirstExecution, limit });
    }
    if (foldersInThisFolder && foldersInThisFolder.length > 0) {
      pushChildFoldersToStack({ stack, parentFolder: folder, folders: foldersInThisFolder });
    }
  }
}

function indexDatabaseChildren(database: Database): DatabaseChildrenIndex {
  const filesByParentUuid = new Map<string | undefined, SimpleDriveFile[]>();
  const foldersByParentUuid = new Map<string | undefined, SimpleDriveFolder[]>();

  for (const file of database.files) {
    const files = filesByParentUuid.get(file.parentUuid);
    if (files) {
      files.push(file);
    } else {
      filesByParentUuid.set(file.parentUuid, [file]);
    }
  }

  for (const folder of database.folders) {
    const folders = foldersByParentUuid.get(folder.parentUuid);
    if (folders) {
      folders.push(folder);
    } else {
      foldersByParentUuid.set(folder.parentUuid, [folder]);
    }
  }

  return { filesByParentUuid, foldersByParentUuid };
}

async function processFolderPlaceHolder({ ctx, item, fileExplorer }: { ctx: SyncContext; item: StackItem; fileExplorer: FileExplorer }) {
  if (!item.requiresPlaceholderUpdate) return true;

  if (isDeletedOrTrashed(item.folder.status)) {
    await deleteItemPlaceholder({ ctx, type: 'folder', remote: item.folder, locals: fileExplorer.folders });
    return false;
  }

  const success = await updateFolderPlaceholder({ ctx, remote: item.folder, folders: fileExplorer.folders });
  return success && !ctx.abortController.signal.aborted;
}

async function processFilesInFolder({
  ctx,
  folder,
  files,
  fileExplorer,
  isFirstExecution,
  limit,
}: {
  ctx: SyncContext;
  folder: Pick<ExtendedDriveFolder, 'absolutePath' | 'uuid'>;
  files: SimpleDriveFile[];
  fileExplorer: FileExplorer;
  isFirstExecution: boolean;
  limit: LimitFunction;
}) {
  await Promise.all(
    files.map((file) =>
      limit(async () => {
        await processFile({ ctx, folder, file, fileExplorer, isFirstExecution });
      }),
    ),
  );
}

async function processFile({
  ctx,
  folder,
  file,
  fileExplorer,
  isFirstExecution,
}: {
  ctx: SyncContext;
  folder: Pick<ExtendedDriveFolder, 'absolutePath' | 'uuid'>;
  file: SimpleDriveFile;
  fileExplorer: FileExplorer;
  isFirstExecution: boolean;
}) {
  const absolutePath = join(folder.absolutePath, file.name);
  const remote = { ...file, absolutePath };

  if (isDeletedOrTrashed(file.status)) {
    await deleteItemPlaceholder({ ctx, type: 'file', remote, locals: fileExplorer.files });
  } else {
    await updateFilePlaceholder({ ctx, remote, files: fileExplorer.files, isFirstExecution });
  }
}

function pushChildFoldersToStack({
  stack,
  parentFolder,
  folders,
}: {
  stack: StackItem[];
  parentFolder: Pick<ExtendedDriveFolder, 'absolutePath' | 'uuid'>;
  folders: SimpleDriveFolder[];
}) {
  for (let index = folders.length - 1; index >= 0; index -= 1) {
    const child = folders[index];
    const absolutePath = join(parentFolder.absolutePath, child.name);
    stack.push({ folder: { ...child, absolutePath }, requiresPlaceholderUpdate: true });
  }
}

function isDeletedOrTrashed(status: SimpleDriveFile['status'] | SimpleDriveFolder['status']) {
  return status === 'DELETED' || status === 'TRASHED';
}
