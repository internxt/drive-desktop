import { logger } from '../../../shared/logger/logger';
import { RemoteSyncedFolder } from '../helpers';
import { RemoteSyncManager } from '../RemoteSyncManager';
import { reportError } from '../../bug-report/service';
import Logger from 'electron-log';
import { FetchRemoteFoldersService } from './fetch-remote-folders.service';

const MAX_RETRIES = 3;

export class SyncRemoteFoldersService {
  constructor(private readonly fetchRemoteFolders = new FetchRemoteFoldersService()) {}

  async run({
    self,
    retry,
    from,
    folderId,
  }: {
    self: RemoteSyncManager;
    retry: number;
    from?: Date;
    folderId?: number;
  }): Promise<RemoteSyncedFolder[]> {
    const allResults: RemoteSyncedFolder[] = [];

    let offset = 0;
    let hasMore = true;

    try {
      logger.info({ msg: 'Syncing folders', from });

      while (hasMore) {
        logger.info({ msg: 'Retrieving folders', offset });

        const { hasMore: newHasMore, result } = await this.fetchRemoteFolders.run({
          self,
          offset,
          folderId,
          updatedAtCheckpoint: from,
          status: 'ALL',
        });

        await Promise.all(
          result.map(async (remoteFolder) => {
            await self.db.folders.create(remoteFolder);
            self.totalFoldersSynced++;
          }),
        );

        allResults.push(...result);
        hasMore = newHasMore;
        offset += self.config.fetchFoldersLimitPerRequest;
      }

      return allResults;
    } catch (error) {
      Logger.error('Remote folders sync failed with error: ', error);

      reportError(error as Error, {
        lastFoldersSyncAt: from ? from.toISOString() : 'INITIAL_FOLDERS_SYNC',
      });

      if (retry >= MAX_RETRIES) {
        self.foldersSyncStatus = 'SYNC_FAILED';
        self.checkRemoteSyncStatus();
        return [];
      }

      return await this.run({ self, retry: retry + 1, from });
    }
  }
}
