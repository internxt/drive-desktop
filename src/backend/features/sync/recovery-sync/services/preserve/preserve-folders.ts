import { Result } from '@internxt/drive-desktop-core/build/common/result';
import { SimpleDriveFolder } from '@/apps/main/database/entities/DriveFolder';
import { SyncContext } from '@/apps/sync-engine/config';
import { FileExplorerFolders } from '@/backend/features/remote-sync/sync-items-by-checkpoint/load-in-memory-paths';
import { AbsolutePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { ItemToPreserve } from '@/infra/sqlite/services/recovery-sync/map-item-to-preserve';
import { SqliteModule } from '@/infra/sqlite/sqlite.module';
import { createRecoverySyncAbortError } from '../../common/create-recovery-sync-abort-error';
import { isInsidePath } from './get-preserved-path';
import { preserveItem, PreserveRun } from './preserve-item';

type Props = {
  ctx: SyncContext;
  run: PreserveRun;
  folders: FileExplorerFolders;
};

type LocalFolder = {
  uuid: string;
  path: AbsolutePath;
  removalStatus: ItemToPreserve<SimpleDriveFolder>['removalStatus'];
};

/**
 * v2.7.2 Alexis Mora
 * A removed folder is moved as a whole, so its files that were never uploaded go with it and its files are not moved one by one.
 * Parents go before their subfolders, and a subfolder that went with its parent is only marked as removed.
 * A folder with something below it that must stay in the Drive is left in place, and its removed files are preserved
 * one by one by the files step.
 * Returns the folders that were moved, so the files step skips their files, and the folders that could not be preserved.
 */
export async function preserveFolders({
  ctx,
  run,
  folders,
}: Props): Promise<Result<{ moved: AbsolutePath[]; failed: AbsolutePath[] }, Error>> {
  const listed = listLocalFolders({ ctx, folders });
  if (listed.error) return Result.err(listed.error);

  const moved: AbsolutePath[] = [];
  const failed: AbsolutePath[] = [];

  for (const folder of listed.data) {
    if (ctx.abortController.signal.aborted) return Result.err(createRecoverySyncAbortError());

    const outcome = await preserveFolder({ ctx, run, folder, moved });
    if (outcome.error) return Result.err(outcome.error);

    if (outcome.data === 'moved') moved.push(folder.path);
    if (outcome.data === 'failed') failed.push(folder.path);
  }

  return Result.ok({ moved, failed });
}

async function preserveFolder({
  ctx,
  run,
  folder,
  moved,
}: {
  ctx: SyncContext;
  run: PreserveRun;
  folder: LocalFolder;
  moved: AbsolutePath[];
}): Promise<Result<'moved' | 'failed' | 'skipped', Error>> {
  if (moved.some((parent) => isInsidePath({ parent, path: folder.path }))) {
    const removed = markRemoved({ ctx, folder });
    return removed.error ? Result.err(removed.error) : Result.ok('skipped');
  }

  const isProtected = SqliteModule.RecoverySyncModule.hasProtectedDescendants({
    rootUuid: ctx.rootUuid,
    userUuid: ctx.userUuid,
    workspaceId: ctx.workspaceId,
    folderUuid: folder.uuid,
  });
  if (isProtected.error) return Result.err(isProtected.error);
  if (isProtected.data) {
    ctx.logger.debug({ msg: 'Recovery sync folder kept, it has contents that stay in the Drive', path: folder.path });
    return Result.ok('skipped');
  }

  const stage = await preserveItem({
    ctx,
    run,
    itemType: 'folder',
    uuid: folder.uuid,
    source: folder.path,
    removalStatus: folder.removalStatus,
  });
  if (stage.data === 'done') return Result.ok('moved');
  if (stage.error || stage.data === 'failed') {
    ctx.logger.error({ msg: 'Recovery sync folder could not be preserved', path: folder.path, error: stage.error });
    return Result.ok('failed');
  }

  return Result.ok('skipped');
}

/**
 * v2.7.2 Alexis Mora
 * Folders are read whole because they have to be sorted by depth, and a folder that is not on disk
 * has nothing to preserve, so it is only marked as removed here.
 */
function listLocalFolders({ ctx, folders }: { ctx: SyncContext; folders: FileExplorerFolders }): Result<LocalFolder[], Error> {
  const local: LocalFolder[] = [];
  let afterUuid = '';
  let hasMore = true;

  while (hasMore) {
    const page = SqliteModule.RecoverySyncModule.getFoldersToPreserve({
      rootUuid: ctx.rootUuid,
      userUuid: ctx.userUuid,
      workspaceId: ctx.workspaceId,
      afterUuid,
    });
    if (page.error) return Result.err(page.error);

    for (const { item, removalStatus } of page.data) {
      const path = folders.get(item.uuid)?.path;
      if (path) {
        local.push({ uuid: item.uuid, path, removalStatus });
        continue;
      }

      const removed = markRemoved({ ctx, folder: { uuid: item.uuid, removalStatus } });
      if (removed.error) return Result.err(removed.error);
    }

    afterUuid = page.data.at(-1)?.item.uuid ?? afterUuid;
    hasMore = page.data.length > 0;
  }

  return Result.ok(local.toSorted((a, b) => a.path.split('/').length - b.path.split('/').length));
}

function markRemoved({ ctx, folder }: { ctx: SyncContext; folder: Pick<LocalFolder, 'uuid' | 'removalStatus'> }) {
  return SqliteModule.RecoverySyncModule.markRemovedIfEligible({
    rootUuid: ctx.rootUuid,
    userUuid: ctx.userUuid,
    workspaceId: ctx.workspaceId,
    itemType: 'folder',
    uuid: folder.uuid,
    removalStatus: folder.removalStatus,
  });
}
