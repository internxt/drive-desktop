import { DriveServerWipModule } from '@/infra/drive-server-wip/drive-server-wip.module';
import { SyncContext } from '@/apps/sync-engine/config';
import { getLocalFolders } from './get-local-folders';
import { createOrUpdateFolders } from '@/backend/features/remote-sync/update-in-sqlite/create-or-update-folder';
import { FETCH_LIMIT_1000 } from '@/apps/main/remote-sync/store';
import { SqliteModule } from '@/infra/sqlite/sqlite.module';
import { getItemsToSync } from '../common/get-items-to-sync';
import { getDeletedItems } from '../common/get-deleted-items';

type Props = {
  ctx: SyncContext;
  offset: number;
};

export async function foldersRecoverySync({ ctx, offset }: Props) {
  const extra = { abortSignal: ctx.abortController.signal, skipLog: true };
  const query = {
    limit: FETCH_LIMIT_1000,
    offset,
    status: 'EXISTS' as const,
    sort: 'uuid',
    order: 'ASC',
  };

  const { data: remotes } = ctx.workspaceId
    ? await DriveServerWipModule.WorkspaceModule.getFoldersInWorkspace({ workspaceId: ctx.workspaceId, query }, extra)
    : await DriveServerWipModule.FolderModule.getFolders({ query }, extra);

  if (!remotes) {
    ctx.logger.debug({ msg: 'There are no remotes folders to run the recovery sync' });
    return [];
  }

  const locals = await getLocalFolders({ ctx, remotes });

  if (!locals) return [];

  const foldersToSync = await getItemsToSync({ ctx, type: 'folder', remotes, locals });
  const deletedFolders = getDeletedItems({ ctx, type: 'folder', remotes, locals });

  const foldersToSyncPromises = createOrUpdateFolders({ context: ctx, folderDtos: foldersToSync });
  const deletedFoldersPromises = deletedFolders.map(async (folder) => {
    return await SqliteModule.FolderModule.updateByUuid({
      uuid: folder.uuid,
      payload: { status: 'DELETED' },
    });
  });

  await Promise.all([foldersToSyncPromises, deletedFoldersPromises]);

  return remotes;
}
