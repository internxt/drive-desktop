import pLimit, { LimitFunction } from 'p-limit';
import { FileUuid } from '@/apps/main/database/entities/DriveFile';
import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';
import { SyncContext } from '@/apps/sync-engine/config';
import { traverseDepthFirst } from '@/backend/features/virtual-drive/tree-traversal/traverse-depth-first';
import { AbsolutePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { statReaddir } from '@/infra/file-system/services/stat-readdir';
import { NodeWin } from '@/infra/node-win/node-win.module';
import { PinState } from '@/node-win/types/placeholder.type';
import { loadFileExplorerFiles } from './load-file-explorer-files';

// Store just the required properties to reduce RAM usage
export type FileExplorerItem = { path: AbsolutePath; parentUuid: FolderUuid };
export type FileExplorerFile = FileExplorerItem & {
  pinState: PinState;
  onDiskSize: number;
  size: number;
  mtimeMs: number;
};
export type FileExplorerFiles = Map<FileUuid, FileExplorerFile>;
export type FileExplorerFolders = Map<FolderUuid, FileExplorerItem>;
type StackItem =
  | { path: AbsolutePath; uuid: FolderUuid; requiresPlaceholderLoad: false }
  | { path: AbsolutePath; parentUuid: FolderUuid; uuid?: FolderUuid; requiresPlaceholderLoad: true };

export async function loadInMemoryPaths({ ctx }: { ctx: SyncContext }) {
  const files: FileExplorerFiles = new Map();
  const folders: FileExplorerFolders = new Map();
  const limit = pLimit(20);
  const root: StackItem = { path: ctx.rootPath, uuid: ctx.rootUuid, requiresPlaceholderLoad: false };

  await traverseDepthFirst<StackItem>({
    root,
    abortSignal: ctx.abortController?.signal,
    processNode: (item) => loadFolder({ ctx, folders, item }),
    processChildren: (item) => processChildren({ item, files, limit }),
  });

  return { files, folders };
}

async function loadFolder({ ctx, folders, item }: { ctx: SyncContext; folders: FileExplorerFolders; item: StackItem }): Promise<boolean> {
  if (!item.requiresPlaceholderLoad) return true;

  const { data: placeholder } = await NodeWin.getFolderInfo({ ctx, path: item.path });
  if (!placeholder) return false;

  item.uuid = placeholder.uuid;
  folders.set(placeholder.uuid, { path: item.path, parentUuid: item.parentUuid });
  return true;
}

async function processChildren({
  item,
  files,
  limit,
}: {
  item: StackItem;
  files: FileExplorerFiles;
  limit: LimitFunction;
}): Promise<Array<StackItem>> {
  const parentUuid = item.uuid;
  if (!parentUuid) return [];

  const items = await statReaddir({ folder: item.path });

  await loadFileExplorerFiles({ files, items: items.files, limit, parentUuid });
  return items.folders.map<StackItem>(({ path }) => ({ path, parentUuid, requiresPlaceholderLoad: true }));
}
