/* eslint-disable no-await-in-loop */
import { RemoteSyncedFolder } from '../helpers';
import { RemoteSyncManager } from '../RemoteSyncManager';
import { FetchRemoteFoldersService } from './fetch-remote-folders.service';
import { FetchFoldersService, FetchFoldersServiceParams } from './fetch-folders.service.interface';
import { FetchWorkspaceFoldersService } from './fetch-workspace-folders.service';
import { loggerService } from '@/apps/shared/logger/logger';

const MAX_RETRIES = 3;

export class SyncRemoteFoldersService {
  constructor(
    private readonly workspaceId?: string,
    private readonly fetchRemoteFolders: FetchFoldersService = workspaceId
      ? new FetchWorkspaceFoldersService()
      : new FetchRemoteFoldersService(),
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
    allResults?: RemoteSyncedFolder[];
  }): Promise<RemoteSyncedFolder[]> {
    let hasMore = true;

    try {
      while (hasMore) {
        this.logger.debug({
          msg: 'Retrieving folders',
          workspacesId: this.workspaceId,
          folderUuid,
          from,
          offset,
        });

        /**
         * v2.5.1 Daniel Jiménez
         * We fetch ALL folders when we want to synchronize the current state with the web state.
         * It means that we need to delete or create the folders that are not in the web state anymore.
         * However, if no checkpoint is provided it means that we don't have a local state yet.
         * In that situation, fetch only EXISTS folders.
         */
        const param: FetchFoldersServiceParams = {
          self,
          offset,
          updatedAtCheckpoint: from,
          status: from ? 'ALL' : 'EXISTS',
          folderUuid: folderUuid,
        };

        const { hasMore: newHasMore, result } = await this.fetchRemoteFolders.run(param);

        await Promise.all(
          result.map(async (remoteFolder) => {
            await self.db.folders.create({
              ...remoteFolder,
              workspaceId: this.workspaceId,
            });
            self.totalFoldersSynced++;
          }),
        );

        allResults.push(...result);
        hasMore = newHasMore;
        offset += self.config.fetchFoldersLimitPerRequest;
      }

      return allResults;
    } catch (exc) {
      this.logger.error({ msg: 'Remote folders sync failed', exc, retry, offset });

      if (retry >= MAX_RETRIES) {
        self.foldersSyncStatus = 'SYNC_FAILED';
        self.checkRemoteSyncStatus();
        return [];
      }

      return await this.run({ self, retry: retry + 1, from, offset, allResults });
    }
  }
}
