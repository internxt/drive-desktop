import { synchronizeRemoteItems, SynchronizationPageRequest } from '@internxt/drive-desktop-core/build/backend/features/sync';
import { SyncContext } from '@/apps/sync-engine/config';
import { driveServerWip } from '@/infra/drive-server-wip/drive-server-wip.module';
import { FETCH_LIMIT_1000 } from '../store';
import { getInitialSyncUpdatedAt } from '../utils/get-initial-sync-updated-at';
import { persistFolders } from './persist-folders';

type SyncRemoteFoldersProps = {
  ctx: SyncContext;
  from?: Date;
};

export async function syncRemoteFolders({ ctx, from }: SyncRemoteFoldersProps): Promise<void> {
  const result = await synchronizeRemoteItems({
    updatedAt: getInitialSyncUpdatedAt(from),
    limit: FETCH_LIMIT_1000,
    fetchPage: async (query) => await fetchFoldersSyncPage({ ctx, query }),
    persistItems: async ({ items }) => await persistFolders({ ctx, items }),
  });

  if (result.error) ctx.logger.error({ msg: 'Error synchronizing remote folders', error: result.error });
}

async function fetchFoldersSyncPage({ ctx, query }: { ctx: SyncContext; query: SynchronizationPageRequest }) {
  if (ctx.workspaceId) {
    return await driveServerWip.workspaces.getFoldersSyncPage({ ctx, context: { query } });
  }

  return await driveServerWip.folders.getFoldersSyncPage({ ctx, context: { query } });
}
