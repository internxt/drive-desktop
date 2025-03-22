/* eslint-disable no-await-in-loop */
import { RemoteSyncedFolder } from '../helpers';
import { RemoteSyncManager } from '../RemoteSyncManager';
import { FetchRemoteFoldersService } from './fetch-remote-folders.service';
import { FetchFoldersService, FetchFoldersServiceParams } from './fetch-folders.service.interface';
import { FetchWorkspaceFoldersService } from './fetch-workspace-folders.service';
import { loggerService } from '@/apps/shared/logger/logger';
import { FETCH_FOLDERS_LIMIT_PER_REQUEST } from '../store';

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
    folderId,
    retry = 1,
    offset = 0,
    allResults = [],
  }: {
    self: RemoteSyncManager;
    retry?: number;
    from?: Date;
    folderId?: number | string;
    offset?: number;
    allResults?: RemoteSyncedFolder[];
  }): Promise<RemoteSyncedFolder[]> {
    let hasMore = true;

    try {
      this.logger.debug({ msg: 'Syncing folders', from });

      while (hasMore) {
        this.logger.debug({ msg: 'Retrieving folders', offset });

        const param: FetchFoldersServiceParams = {
          self,
          offset,
          updatedAtCheckpoint: from,
          status: 'ALL',
        };

        if (folderId) {
          if (typeof folderId === 'string') {
            param.folderUuid = folderId;
          } else if (typeof folderId === 'number') {
            param.folderId = folderId;
          }
        }

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
        offset += FETCH_FOLDERS_LIMIT_PER_REQUEST;
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
