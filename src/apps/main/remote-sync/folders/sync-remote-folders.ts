import { createOrUpdateFolders } from '@/backend/features/remote-sync/update-in-sqlite/create-or-update-folder';
import { RemoteSyncManager } from '../RemoteSyncManager';
import { FETCH_LIMIT_1000 } from '../store';
import { driveServerWip } from '@/infra/drive-server-wip/drive-server-wip.module';
import { LokijsModule } from '@/infra/lokijs/lokijs.module';
import { GetFoldersQuery } from '@/infra/drive-server-wip/services/folders.service';

type TProps = {
  self: RemoteSyncManager;
  from?: Date;
  offset?: number;
};

export async function syncRemoteFolders({ self, from, offset = 0 }: TProps) {
  let hasMore = true;

  while (hasMore) {
    /**
     * v2.5.0 Daniel Jiménez
     * We fetch ALL folders when we want to synchronize the current state with the web state.
     * It means that we need to delete or create the folders that are not in the web state anymore.
     * However, if no checkpoint is provided it means that we don't have a local state yet.
     * In that situation, fetch only EXISTS folders.
     */
    const query: GetFoldersQuery = {
      limit: FETCH_LIMIT_1000,
      offset,
      status: from ? 'ALL' : 'EXISTS',
      updatedAt: from?.toISOString(),
      sort: 'updatedAt',
      order: 'ASC',
    };

    const promise = self.workspaceId
      ? driveServerWip.workspaces.getFoldersInWorkspace({ workspaceId: self.workspaceId, query })
      : driveServerWip.folders.getFolders({ query });

    const { data: folderDtos, error } = await promise;

    if (error) throw error;

    hasMore = folderDtos.length === FETCH_LIMIT_1000;
    offset += FETCH_LIMIT_1000;

    await createOrUpdateFolders({ context: self.context, folderDtos });

    const lastFolder = folderDtos.at(-1);
    if (lastFolder) {
      await LokijsModule.CheckpointsModule.updateCheckpoint({
        userUuid: self.context.userUuid,
        workspaceId: self.workspaceId,
        type: 'folder',
        plainName: lastFolder.plainName,
        checkpoint: lastFolder.updatedAt,
      });
    }
  }
}
