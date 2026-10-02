import { synchronizeRemoteItems, SynchronizationPageRequest } from '@internxt/drive-desktop-core/build/backend/features/sync';
import { SyncContext } from '@/apps/sync-engine/config';
import { driveServerWip } from '@/infra/drive-server-wip/drive-server-wip.module';
import { FETCH_LIMIT_1000 } from '../store';
import { persistFiles } from './persist-files';

type SyncRemoteFilesProps = {
  ctx: SyncContext;
  from?: Date;
};

export async function syncRemoteFiles({ ctx, from }: SyncRemoteFilesProps): Promise<void> {
  const result = await synchronizeRemoteItems({
    from,
    limit: FETCH_LIMIT_1000,
    fetchPage: async (query) => await fetchFilesSyncPage({ ctx, query }),
    persistItems: async ({ items }) => await persistFiles({ ctx, items }),
  });

  if (result.error) ctx.logger.error({ msg: 'Error synchronizing remote files', error: result.error });
}

async function fetchFilesSyncPage({ ctx, query }: { ctx: SyncContext; query: SynchronizationPageRequest }) {
  if (ctx.workspaceId) {
    return await driveServerWip.workspaces.getFilesSyncPage({ ctx, context: { query } });
  }

  return await driveServerWip.files.getFilesSyncPage({ ctx, context: { query } });
}
