import { RemoteSyncManager } from '../RemoteSyncManager';
import { logger } from '@/apps/shared/logger/logger';
import { FETCH_LIMIT } from '../store';
import { getUserOrThrow } from '../../auth/service';
import { syncRemoteFolder } from './sync-remote-folder';
import { driveServerWip } from '@/infra/drive-server-wip/drive-server-wip.module';
import { retryWrapper } from '@/infra/drive-server-wip/out/retry-wrapper';

type TProps = {
  self: RemoteSyncManager;
  from?: Date;
  offset?: number;
};

export async function syncRemoteFolders({ self, from, offset = 0 }: TProps) {
  const user = getUserOrThrow();
  let hasMore = true;

  while (hasMore) {
    logger.debug({
      msg: 'Retrieving folders',
      workspaceId: self.workspaceId,
      from,
      offset,
    });

    /**
     * v2.5.0 Daniel Jiménez
     * We fetch ALL folders when we want to synchronize the current state with the web state.
     * It means that we need to delete or create the folders that are not in the web state anymore.
     * However, if no checkpoint is provided it means that we don't have a local state yet.
     * In that situation, fetch only EXISTS folders.
     */
    const query = {
      limit: FETCH_LIMIT,
      offset,
      status: from ? ('ALL' as const) : ('EXISTS' as const),
      updatedAt: from?.toISOString(),
    };

    const promise = () =>
      self.workspaceId
        ? driveServerWip.workspaces.getFoldersInWorkspace({ workspaceId: self.workspaceId, query })
        : driveServerWip.folders.getFolders({ query });

    const { data, error } = await retryWrapper({
      promise,
      loggerBody: {
        tag: 'SYNC-ENGINE',
        msg: 'Retry fetching folders',
      },
    });

    if (!data) throw error;

    hasMore = data.length === FETCH_LIMIT;
    offset += FETCH_LIMIT;

    await Promise.all(
      data.map(async (remoteFolder) => {
        await syncRemoteFolder({ self, user, remoteFolder });
      }),
    );
  }
}
