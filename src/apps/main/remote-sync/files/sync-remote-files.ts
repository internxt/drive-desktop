import { RemoteSyncManager } from '../RemoteSyncManager';
import { logger } from '@/apps/shared/logger/logger';
import { FETCH_LIMIT } from '../store';
import { getUserOrThrow } from '../../auth/service';
import { syncRemoteFile } from './sync-remote-file';
import { driveServerWip } from '@/infra/drive-server-wip/drive-server-wip.module';
import { retryWrapper } from '@/infra/drive-server-wip/out/retry-wrapper';

type TProps = {
  self: RemoteSyncManager;
  from?: Date;
  offset?: number;
};

export async function syncRemoteFiles({ self, from, offset = 0 }: TProps) {
  const user = getUserOrThrow();
  let hasMore = true;

  while (hasMore) {
    logger.debug({
      msg: 'Retrieving files',
      workspaceId: self.workspaceId,
      from,
      offset,
    });

    /**
     * v2.5.0 Daniel Jiménez
     * We fetch ALL files when we want to synchronize the current state with the web state.
     * It means that we need to delete or create the files that are not in the web state anymore.
     * However, if no checkpoint is provided it means that we don't have a local state yet.
     * In that situation, fetch only EXISTS files.
     */
    const query = {
      limit: FETCH_LIMIT,
      offset,
      status: from ? ('ALL' as const) : ('EXISTS' as const),
      updatedAt: from?.toISOString(),
    };

    const promise = () =>
      self.workspaceId
        ? driveServerWip.workspaces.getFilesInWorkspace({ workspaceId: self.workspaceId, query })
        : driveServerWip.files.getFiles({ query });

    const data = await retryWrapper({ promise });

    hasMore = data.length === FETCH_LIMIT;
    offset += FETCH_LIMIT;

    await Promise.all(
      data.map(async (remoteFile) => {
        await syncRemoteFile({ self, user, remoteFile });
      }),
    );
  }
}
