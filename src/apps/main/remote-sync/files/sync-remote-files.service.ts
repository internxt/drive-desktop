import { logger } from '../../../shared/logger/logger';
import { RemoteSyncedFile } from '../helpers';
import { RemoteSyncManager } from '../RemoteSyncManager';
import { reportError } from '../../bug-report/service';
import Logger from 'electron-log';
import { FetchRemoteFilesService } from './fetch-remote-files.service';

const MAX_RETRIES = 3;

export class SyncRemoteFilesService {
  constructor(private readonly fetchRemoteFiles = new FetchRemoteFilesService()) {}

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
  }): Promise<RemoteSyncedFile[]> {
    const allResults: RemoteSyncedFile[] = [];

    let offset = 0;
    let hasMore = true;

    try {
      logger.info({ msg: 'Syncing files', from });

      while (hasMore) {
        logger.info({ msg: 'Retrieving files', offset });

        const { hasMore: newHasMore, result } = await this.fetchRemoteFiles.run({
          self,
          offset,
          folderId,
          updatedAtCheckpoint: from,
          status: 'ALL',
        });

        await Promise.all(
          result.map(async (remoteFile) => {
            self.db.files.create(remoteFile);
            self.totalFilesSynced++;
          }),
        );

        allResults.push(...result);
        hasMore = newHasMore;
        offset += self.config.fetchFilesLimitPerRequest;
      }

      return allResults;
    } catch (error) {
      Logger.error('Remote files sync failed with error: ', error);

      reportError(error as Error, {
        lastFilesSyncAt: from ? from.toISOString() : 'INITIAL_FILES_SYNC',
      });

      if (retry >= MAX_RETRIES) {
        self.filesSyncStatus = 'SYNC_FAILED';
        self.checkRemoteSyncStatus();
        return [];
      }

      return await this.run({ self, retry: retry + 1, from });
    }
  }
}
