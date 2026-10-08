import { Result } from '@internxt/drive-desktop-core/build/common/result';
import { createOrUpdateFiles } from '../../../../backend/features/remote-sync/update-in-sqlite/create-or-update-file';
import { ParsedFileDto } from '../../../../infra/drive-server-wip/out/dto';
import { SqliteModule } from '../../../../infra/sqlite/sqlite.module';
import { SyncContext } from '../../../sync-engine/config';

export async function persistFiles({ ctx, items }: { ctx: SyncContext; items: ParsedFileDto[] }): Promise<Result<void, Error>> {
  const persistenceError = await createOrUpdateFiles({ ctx, fileDtos: items });

  if (persistenceError) {
    return Result.err(persistenceError);
  }

  if (items.length === 0) {
    return Result.ok(undefined);
  }

  const latestFile = items.reduce((latest, file) => (file.updatedAt > latest.updatedAt ? file : latest), items[0]);

  const checkpointError = SqliteModule.CheckpointModule.createOrUpdate({
    userUuid: ctx.userUuid,
    workspaceId: ctx.workspaceId,
    type: 'file',
    name: latestFile.plainName,
    updatedAt: latestFile.updatedAt,
  });

  if (checkpointError) {
    return Result.err(checkpointError);
  }

  return Result.ok(undefined);
}
