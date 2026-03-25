import { FETCH_LIMIT_1000 } from '@/apps/main/remote-sync/store';
import { SyncContext } from '@/apps/sync-engine/config';
import { createOrUpdateFiles } from '@/backend/features/remote-sync/update-in-sqlite/create-or-update-file';
import { DriveServerWipModule } from '@/infra/drive-server-wip/drive-server-wip.module';
import { GetFilesQuery } from '@/infra/drive-server-wip/services/files.service';
import { SqliteModule } from '@/infra/sqlite/sqlite.module';
import { getDeletedItems } from '../common/get-deleted-items';
import { getItemsToSync } from '../common/get-items-to-sync';
import { getLocalFiles } from './get-local-files';

type Props = {
  ctx: SyncContext;
  offset: number;
};

export async function filesRecoverySync({ ctx, offset }: Props) {
  const { data: checkpoint } = await SqliteModule.CheckpointModule.getCheckpoint({
    userUuid: ctx.userUuid,
    workspaceId: ctx.workspaceId,
    type: 'file',
  });

  if (!checkpoint) return [];

  const query: GetFilesQuery = {
    limit: FETCH_LIMIT_1000,
    offset,
    status: 'EXISTS',
    sort: 'uuid',
    order: 'ASC',
  };

  const { data: remotes } = ctx.workspaceId
    ? await DriveServerWipModule.WorkspaceModule.getFiles({ ctx, query, skipLog: true })
    : await DriveServerWipModule.FileModule.getFiles({ ctx, context: { query }, skipLog: true });

  if (!remotes) {
    ctx.logger.debug({ msg: 'There are no remotes files to run the recovery sync' });
    return [];
  }

  const locals = await getLocalFiles({ ctx, remotes });

  if (!locals) return [];

  const filesToSync = getItemsToSync({ ctx, type: 'file', remotes, locals, checkpoint });
  const deletedFiles = getDeletedItems({ ctx, type: 'file', remotes, locals, checkpoint });

  const filesToSyncPromises = createOrUpdateFiles({ ctx, fileDtos: filesToSync });
  const deletedFilesPromises = deletedFiles.map(async (file) => {
    return await SqliteModule.FileModule.updateByUuid({
      uuid: file.uuid,
      payload: { status: 'DELETED' },
    });
  });

  await Promise.all([filesToSyncPromises, deletedFilesPromises]);

  return remotes;
}
