import { Result } from '@internxt/drive-desktop-core/build/common/result';
import { SyncContext } from '@/apps/sync-engine/config';
import { SqliteModule } from '@/infra/sqlite/sqlite.module';
import { getItemsToRepair, getRepairCandidates } from './get-items-to-repair';
import { RecoverySyncFile, RecoverySyncFolder } from './map-recovery-sync-page';

type Props<T> = {
  ctx: SyncContext;
  items: T[];
  checkpoint: string;
};

export async function repairRecoverySyncFiles({ ctx, items, checkpoint }: Props<RecoverySyncFile>): Promise<Result<void, Error>> {
  const { userUuid, workspaceId } = ctx;
  const candidates = getRepairCandidates({ remotes: items, checkpoint });
  if (candidates.length === 0) return Result.ok(undefined);

  const locals = SqliteModule.FileModule.getFilesByUuids({ userUuid, workspaceId, uuids: candidates.map(({ uuid }) => uuid) });
  if (locals.error) return Result.err(locals.error);

  const files = getItemsToRepair({ candidates, locals: locals.data });
  if (files.length === 0) return Result.ok(undefined);

  ctx.logger.debug({ msg: 'Recovery sync repairing files', count: files.length });

  const error = await SqliteModule.FileModule.createOrUpdateBatch({
    files: files.map((file) => ({ ...file, userUuid, workspaceId })),
  });

  return error ? Result.err(error) : Result.ok(undefined);
}

export async function repairRecoverySyncFolders({ ctx, items, checkpoint }: Props<RecoverySyncFolder>): Promise<Result<void, Error>> {
  const { userUuid, workspaceId } = ctx;
  const candidates = getRepairCandidates({ remotes: items, checkpoint });
  if (candidates.length === 0) return Result.ok(undefined);

  const locals = SqliteModule.FolderModule.getFoldersByUuids({ userUuid, workspaceId, uuids: candidates.map(({ uuid }) => uuid) });
  if (locals.error) return Result.err(locals.error);

  const folders = getItemsToRepair({ candidates, locals: locals.data });
  if (folders.length === 0) return Result.ok(undefined);

  ctx.logger.debug({ msg: 'Recovery sync repairing folders', count: folders.length });

  const error = await SqliteModule.FolderModule.createOrUpdateBatch({
    folders: folders.map((folder) => ({ ...folder, userUuid, workspaceId })),
  });

  return error ? Result.err(error) : Result.ok(undefined);
}
