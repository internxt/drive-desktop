import { DriveServerWipModule } from '@/infra/drive-server-wip/drive-server-wip.module';
import { SyncContext } from '@/apps/sync-engine/config';
import { getLocalFiles } from './get-local-files';
import { createOrUpdateFiles } from '@/backend/features/remote-sync/update-in-sqlite/create-or-update-file';
import { FETCH_LIMIT_1000 } from '@/apps/main/remote-sync/store';
import { SqliteModule } from '@/infra/sqlite/sqlite.module';
import { getItemsToSync } from '../common/get-items-to-sync';
import { getDeletedItems } from '../common/get-deleted-items';
import { GetFilesQuery } from '@/infra/drive-server-wip/services/files.service';
import { FileUuid } from '@/apps/main/database/entities/DriveFile';
import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';

type Props = {
  ctx: SyncContext;
  offset: number;
  lastId: FileUuid | FolderUuid | undefined;
};

export async function filesRecoverySync({ ctx, offset, lastId }: Props) {
  const query: GetFilesQuery = {
    limit: FETCH_LIMIT_1000,
    offset,
    status: 'EXISTS',
    sort: 'uuid',
    order: 'ASC',
    lastId,
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

  const filesToSync = await getItemsToSync({ ctx, type: 'file', remotes, locals });
  const deletedFiles = getDeletedItems({ ctx, type: 'file', remotes, locals });

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
