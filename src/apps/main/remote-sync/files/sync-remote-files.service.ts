import { RemoteSyncedFile } from '../helpers';
import { RemoteSyncManager } from '../RemoteSyncManager';
import { FetchRemoteFilesService } from './fetch-remote-files.service';
import { FetchWorkspaceFilesService } from './fetch-workspace-files.service';
import { FetchFilesService, FetchFilesServiceParams } from './fetch-files.service.interface';
import { loggerService } from '@/apps/shared/logger/logger';
import { FETCH_LIMIT } from '../store';
import { sleep } from '../../util';
import { getUserOrThrow } from '../../auth/service';
import { syncRemoteFile } from './sync-remote-file';

const MAX_RETRIES = 3;

export class SyncRemoteFilesService {
  constructor(
    private readonly workspaceId?: string,
    private readonly fetchRemoteFiles: FetchFilesService = workspaceId ? new FetchWorkspaceFilesService() : new FetchRemoteFilesService(),
    private readonly logger = loggerService,
  ) {}

  async run({
    self,
    from,
    folderUuid,
    retry = 1,
    offset = 0,
    allResults = [],
  }: {
    self: RemoteSyncManager;
    retry?: number;
    from?: Date;
    folderUuid?: string;
    offset?: number;
    allResults?: RemoteSyncedFile[];
  }): Promise<RemoteSyncedFile[]> {
    let hasMore = true;

    try {
      const user = getUserOrThrow();

      while (hasMore) {
        this.logger.debug({
          msg: 'Retrieving files',
          workspacesId: this.workspaceId,
          folderUuid,
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
        const param: FetchFilesServiceParams = {
          self,
          offset,
          updatedAtCheckpoint: from,
          status: from ? 'ALL' : 'EXISTS',
          folderUuid,
        };

        const { hasMore: newHasMore, result } = await this.fetchRemoteFiles.run(param);

        await Promise.all(
          result.map(async (remoteFile) => {
            await syncRemoteFile({ self, user, remoteFile });
          }),
        );

        allResults.push(...result);
        hasMore = newHasMore;
        offset += FETCH_LIMIT;
      }

      return allResults;
    } catch (exc) {
      this.logger.error({ msg: 'Remote files sync failed', exc, retry, offset });

      if (retry >= MAX_RETRIES) {
        self.changeStatus('SYNC_FAILED');
        return [];
      }

      await sleep(5000);
      return await this.run({ self, retry: retry + 1, from, offset, allResults });
    }
  }
}
