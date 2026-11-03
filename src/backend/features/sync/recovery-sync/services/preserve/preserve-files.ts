import { Result } from '@internxt/drive-desktop-core/build/common/result';
import { FileUuid } from '@/apps/main/database/entities/DriveFile';
import { SyncContext } from '@/apps/sync-engine/config';
import { FileExplorerFiles } from '@/backend/features/remote-sync/sync-items-by-checkpoint/load-in-memory-paths';
import { AbsolutePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { SqliteModule } from '@/infra/sqlite/sqlite.module';
import { createRecoverySyncAbortError } from '../../common/create-recovery-sync-abort-error';
import { isInsidePath } from './get-preserved-path';
import { preserveItem, PreserveRun } from './preserve-item';

type Props = {
  ctx: SyncContext;
  run: PreserveRun;
  files: FileExplorerFiles;
  movedFolders: AbsolutePath[];
};

/**
 * v2.7.2 Alexis Mora
 * Files are read in uuid batches so large Drives are not loaded at once.
 * A file with contents on disk is moved, also when its download was interrupted, so the user keeps the data there is.
 * A file without contents on disk is only marked as removed: it is online only, it is not in the Drive folder,
 * or it went with its removed parent folder. Nothing is downloaded just to preserve it.
 * Returns the files that could not be preserved; they stay in place with their status unchanged.
 */
export async function preserveFiles({ ctx, run, files, movedFolders }: Props): Promise<Result<AbsolutePath[], Error>> {
  const { rootUuid, userUuid, workspaceId } = ctx;
  const failed: AbsolutePath[] = [];
  let afterUuid = '';
  let hasMore = true;

  while (hasMore) {
    if (ctx.abortController.signal.aborted) return Result.err(createRecoverySyncAbortError());

    const page = SqliteModule.RecoverySyncModule.getFilesToPreserve({ rootUuid, userUuid, workspaceId, afterUuid });
    if (page.error) return Result.err(page.error);

    for (const { item, removalStatus } of page.data) {
      const result = await preserveFile({ ctx, run, files, movedFolders, uuid: item.uuid, removalStatus });
      if (result.error) return Result.err(result.error);
      if (result.data) failed.push(result.data);
    }

    afterUuid = page.data.at(-1)?.item.uuid ?? afterUuid;
    hasMore = page.data.length > 0;
  }

  return Result.ok(failed);
}

/**
 * Returns the path of the file when it could not be preserved.
 */
async function preserveFile({
  ctx,
  run,
  files,
  movedFolders,
  uuid,
  removalStatus,
}: Props & { uuid: string; removalStatus: 'TRASHED' | 'DELETED' }): Promise<Result<AbsolutePath | undefined, Error>> {
  const local = files.get(uuid as FileUuid);

  if (!local || local.onDiskSize === 0 || movedFolders.some((parent) => isInsidePath({ parent, path: local.path }))) {
    const removed = SqliteModule.RecoverySyncModule.markRemovedIfEligible({
      rootUuid: ctx.rootUuid,
      userUuid: ctx.userUuid,
      workspaceId: ctx.workspaceId,
      itemType: 'file',
      uuid,
      removalStatus,
    });
    return removed.error ? Result.err(removed.error) : Result.ok(undefined);
  }

  const stage = await preserveItem({ ctx, run, itemType: 'file', uuid, source: local.path, removalStatus });
  if (stage.error || stage.data === 'failed') {
    ctx.logger.error({ msg: 'Recovery sync file could not be preserved', path: local.path, error: stage.error });
    return Result.ok(local.path);
  }

  return Result.ok(undefined);
}
