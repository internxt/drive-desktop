import { AbsolutePath } from '@internxt/drive-desktop-core/build/backend';
import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';
import { SyncContext } from '@/apps/sync-engine/config';
import { traverseDepthFirst } from '@/backend/features/virtual-drive/tree-traversal/traverse-depth-first';
import { statReaddir } from '@/infra/file-system/services/stat-readdir';
import { NodeWin } from '@/infra/node-win/node-win.module';
import { CREATE_PENDING_ITEMS_CONCURRENCY } from './constants';
import { createFolder } from './create-folder';
import { createPendingFiles } from './create-pending-files';

type Props = {
  ctx: SyncContext;
  parentUuid: FolderUuid;
  parentPath: AbsolutePath;
  isFirstExecution: boolean;
};

type PendingFolder = {
  path: AbsolutePath;
  parentUuid?: FolderUuid;
  uuid?: FolderUuid;
  isFirstExecution: boolean;
};

export async function createPendingItems({ ctx, parentUuid, parentPath, isFirstExecution }: Props) {
  try {
    await traverseDepthFirst<PendingFolder>({
      root: { path: parentPath, uuid: parentUuid, isFirstExecution },
      abortSignal: ctx.abortController.signal,
      processNode: (folder) => resolveFolder({ ctx, folder }),
      processChildren: (folder) => processFolderChildren({ ctx, folder }),
    });
  } catch (error) {
    ctx.logger.error({ msg: 'Error creating pending items', parentPath, error });
  }
}

async function resolveFolder({ ctx, folder }: { ctx: SyncContext; folder: PendingFolder }) {
  if (folder.uuid) return true;
  if (!folder.parentUuid) return false;

  const { data: folderInfo, error } = await NodeWin.getFolderInfo({ ctx, path: folder.path });

  if (folderInfo) {
    if (!folder.isFirstExecution) return false;

    folder.uuid = folderInfo.uuid;
    return true;
  }

  if (!error) return false;

  if (error.code === 'NOT_A_PLACEHOLDER') {
    const folderUuid = await createFolder({
      ctx,
      path: folder.path,
      parentUuid: folder.parentUuid,
      createPendingChildren: false,
    });

    if (!folderUuid) return false;

    folder.uuid = folderUuid;
    return true;
  }

  ctx.logger.error({ msg: 'Error getting folder info', path: folder.path, error });
  return false;
}

async function processFolderChildren({ ctx, folder }: { ctx: SyncContext; folder: PendingFolder }) {
  if (!folder.uuid) return [];

  const { files, folders } = await statReaddir({
    folder: folder.path,
    concurrency: CREATE_PENDING_ITEMS_CONCURRENCY,
    onError: ({ path, error }) => {
      ctx.logger.error({ msg: 'Error getting item stats', path, error });
    },
  });

  await createPendingFiles({ ctx, files, parentUuid: folder.uuid });

  return folders.map(({ path }) => ({ path, parentUuid: folder.uuid, isFirstExecution: folder.isFirstExecution }));
}
