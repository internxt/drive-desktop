/* eslint-disable no-await-in-loop */
import { logger } from '../../../shared/logger/logger';
import { RemoteSyncedFolder } from '../helpers';
import { RemoteSyncManager } from '../RemoteSyncManager';
import { reportError } from '../../bug-report/service';
import Logger from 'electron-log';
import { FetchRemoteFoldersService } from './fetch-remote-folders.service';
import { FetchFoldersService, FetchFoldersServiceParams } from './fetch-folders.service.interface';
import { FetchWorkspaceFoldersService } from './fetch-workspace-folders.service';

const MAX_RETRIES = 3;

export class SyncRemoteFoldersService {
  private fetchRemoteFolders: FetchFoldersService;
  constructor(private readonly workspaceId?: string) {
    this.workspaceId = workspaceId;
    this.fetchRemoteFolders = workspaceId ? new FetchWorkspaceFoldersService() : new FetchRemoteFoldersService();
  }

  async run({
    self,
    retry,
    from,
    folderId,
  }: {
    self: RemoteSyncManager;
    retry: number;
    from?: Date;
    folderId?: number | string;
  }): Promise<RemoteSyncedFolder[]> {
    const allResults: RemoteSyncedFolder[] = [];

    let offset = 0;
    let hasMore = true;

    try {
      logger.info({ msg: 'Syncing folders', from });

      while (hasMore) {
        logger.info({ msg: 'Retrieving folders', offset });

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
