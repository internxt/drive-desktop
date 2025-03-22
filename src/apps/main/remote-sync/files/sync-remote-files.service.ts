/* eslint-disable no-await-in-loop */
import { RemoteSyncedFile } from '../helpers';
import { RemoteSyncManager } from '../RemoteSyncManager';
import { FetchRemoteFilesService } from './fetch-remote-files.service';
import { FetchWorkspaceFilesService } from './fetch-workspace-files.service';
import { FetchFilesService, FetchFilesServiceParams } from './fetch-files.service.interface';
import { loggerService } from '@/apps/shared/logger/logger';
import { FETCH_FILES_LIMIT_PER_REQUEST } from '../store';

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
    allResults?: RemoteSyncedFile[];
  }): Promise<RemoteSyncedFile[]> {
    let hasMore = true;

    try {
      this.logger.debug({ msg: 'Syncing files', from });

      while (hasMore) {
        this.logger.debug({ msg: 'Retrieving files', offset });

        const param: FetchFilesServiceParams = {
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
        offset += FETCH_FILES_LIMIT_PER_REQUEST;
      }

      return allResults;
    } catch (exc) {
      this.logger.error({ msg: 'Remote files sync failed', exc, retry, offset });

      if (retry >= MAX_RETRIES) {
        self.filesSyncStatus = 'SYNC_FAILED';
        self.checkRemoteSyncStatus();
        return [];
      }

      return await this.run({ self, retry: retry + 1, from, offset, allResults });
    }
  }
}
