import { logger } from '@/apps/shared/logger/logger';
import { syncRemoteFile } from './sync-remote-file';
import { BrowserWindow } from 'electron';
import { driveServerWip } from '@/infra/drive-server-wip/drive-server-wip.module';
import { getUserOrThrow } from '@/apps/main/auth/service';
import { FETCH_LIMIT } from '../../store';
import { sleep } from '@/apps/main/util';

type TProps = {
  workspaceId: string;
  browserWindow: BrowserWindow | null;
  from: Date | null;
  retry?: number;
  offset?: number;
};

const MAX_RETRIES = 3;

export async function syncRemoteFiles({ workspaceId, browserWindow, from, retry = 1, offset = 0 }: TProps) {
  let hasMore = true;

  try {
    const user = getUserOrThrow();

    while (hasMore) {
      logger.debug({
        msg: 'Retrieving files',
        workspaceId,
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

      const promise = workspaceId
        ? driveServerWip.workspaces.getFilesInWorkspace({ workspaceId, query })
        : driveServerWip.files.getFiles({ query });

      const { data, error } = await promise;
      if (error) throw error;

      await Promise.all(
        data.map(async (remoteFile) => {
          await syncRemoteFile({
            user,
            remoteFile,
            workspaceId,
            browserWindow,
          });
        }),
      );

      hasMore = data.length === FETCH_LIMIT;
      offset += FETCH_LIMIT;
    }
  } catch (exc) {
    logger.error({ msg: 'Remote files sync failed', exc, retry, offset });

    if (retry >= MAX_RETRIES) {
      throw new Error('Remote files sync failed');
    }

    await sleep(5000);
    await syncRemoteFiles({
      workspaceId,
      browserWindow,
      retry: retry + 1,
      from,
      offset,
    });
  }
}
