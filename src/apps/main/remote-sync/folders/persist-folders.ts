import { Result } from '@internxt/drive-desktop-core/build/common/result';
import { SyncContext } from '@/apps/sync-engine/config';
import { createOrUpdateFolders } from '@/backend/features/remote-sync/update-in-sqlite/create-or-update-folder';
import { ParsedFolderDto } from '@/infra/drive-server-wip/out/dto';
import { SqliteModule } from '@/infra/sqlite/sqlite.module';

export async function persistFolders({ ctx, items }: { ctx: SyncContext; items: ParsedFolderDto[] }): Promise<Result<void, Error>> {
  const persistenceError = await createOrUpdateFolders({ ctx, folderDtos: items });

  if (persistenceError) return Result.err(persistenceError);

  if (items.length === 0) return Result.ok(undefined);

  const latestFolder = items.reduce((latest, folder) => (folder.updatedAt > latest.updatedAt ? folder : latest), items[0]);

  const checkpointError = SqliteModule.CheckpointModule.createOrUpdate({
    userUuid: ctx.userUuid,
    workspaceId: ctx.workspaceId,
    type: 'folder',
    name: latestFolder.plainName,
    updatedAt: latestFolder.updatedAt,
  });

  if (checkpointError) return Result.err(checkpointError);

  return Result.ok(undefined);
}
