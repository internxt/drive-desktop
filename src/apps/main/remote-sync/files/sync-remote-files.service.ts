/* eslint-disable no-await-in-loop */
import { logger } from '../../../shared/logger/logger';
import { RemoteSyncedFile } from '../helpers';
import { RemoteSyncManager } from '../RemoteSyncManager';
import { FetchRemoteFilesService } from './fetch-remote-files.service';
import { FetchWorkspaceFilesService } from './fetch-workspace-files.service';
import { FetchFilesService, FetchFilesServiceParams } from './fetch-files.service.interface';

const MAX_RETRIES = 3;

export class SyncRemoteFilesService {
  constructor(
    private readonly workspaceId?: string,
    private readonly fetchRemoteFiles: FetchFilesService = workspaceId ? new FetchWorkspaceFilesService() : new FetchRemoteFilesService(),
  ) {}

  async run({
    self,
    retry,
    from,
    folderUuid,
  }: {
    self: RemoteSyncManager;
    retry: number;
    from?: Date;
    folderUuid?: string;
  }): Promise<RemoteSyncedFile[]> {
    const allResults: RemoteSyncedFile[] = [];

    let offset = 0;
    let hasMore = true;

    try {
      logger.debug({ msg: 'Syncing files', from });

      while (hasMore) {
        logger.debug({ msg: 'Retrieving files', offset });

        const param: FetchFilesServiceParams = {
          self,
          offset,
          updatedAtCheckpoint: from,
          status: 'ALL',
          folderUuid,
        };

        const { hasMore: newHasMore, result } = await this.fetchRemoteFiles.run(param);

        await Promise.all(
          result.map(async (remoteFile) => {
            self.db.files.create({
              ...remoteFile,
              isDangledStatus: false,
              workspaceId: this.workspaceId,
            });
            self.totalFilesSynced++;
          }),
        );

        allResults.push(...result);
        hasMore = newHasMore;
        offset += self.config.fetchFilesLimitPerRequest;
      }

      return allResults;
    } catch (error) {
      logger.error({ msg: 'Remote files sync failed with error: ', error });

      if (retry >= MAX_RETRIES) {
        self.filesSyncStatus = 'SYNC_FAILED';
        self.checkRemoteSyncStatus();
        return [];
      }

      return await this.run({ self, retry: retry + 1, from });
    }
  }
}
