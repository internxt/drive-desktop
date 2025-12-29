import { createOrUpdateFolders } from '@/backend/features/remote-sync/update-in-sqlite/create-or-update-folder';
import { FETCH_LIMIT_1000 } from '../store';
import { driveServerWip } from '@/infra/drive-server-wip/drive-server-wip.module';
import { GetFoldersQuery } from '@/infra/drive-server-wip/services/folders.service';
import { SqliteModule } from '@/infra/sqlite/sqlite.module';
import { SyncContext } from '@/apps/sync-engine/config';

type TProps = {
  ctx: SyncContext;
  from?: Date;
  offset?: number;
};

export async function syncRemoteFolders({ ctx, from, offset = 0 }: TProps) {
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

    const promise = ctx.workspaceId
      ? driveServerWip.workspaces.getFolders({ ctx, query })
      : driveServerWip.folders.getFolders({ ctx, context: { query } });

    const { data: folderDtos, error } = await promise;

    if (error) return;

    hasMore = folderDtos.length === FETCH_LIMIT_1000;
    offset += FETCH_LIMIT_1000;

    await createOrUpdateFolders({ ctx, folderDtos });

    const lastFolder = folderDtos.at(-1);
    if (lastFolder) {
      await SqliteModule.CheckpointModule.createOrUpdate({
        userUuid: ctx.userUuid,
        workspaceId: ctx.workspaceId,
        type: 'folder',
        name: lastFolder.plainName,
        updatedAt: lastFolder.updatedAt,
      });
    }
  }
}
