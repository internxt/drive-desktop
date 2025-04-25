import { RemoteSyncManager } from '../RemoteSyncManager';
import { FetchFilesServiceParams } from './fetch-files.service.interface';
import { loggerService } from '@/apps/shared/logger/logger';
import { FETCH_LIMIT } from '../store';
import { sleep } from '../../util';
import { getUserOrThrow } from '../../auth/service';
import { syncRemoteFile } from './sync-remote-file';
import { fetchRemoteFiles } from './fetch-remote-files.service';
import { fetchWorkspaceFiles } from './fetch-workspace-files.service';
import { FileDto } from '@/infra/drive-server-wip/out/dto';

const MAX_RETRIES = 3;

export class SyncRemoteFilesService {
  constructor(
    private readonly workspaceId?: string,
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
    allResults?: FileDto[];
  }): Promise<FileDto[]> {
    let hasMore = true;

    try {
      const user = getUserOrThrow();

      while (hasMore) {
        this.logger.debug({
          msg: 'Retrieving files',
          workspaceId: this.workspaceId,
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

        const promise = this.workspaceId ? fetchWorkspaceFiles(param) : fetchRemoteFiles(param);

        const { hasMore: newHasMore, result } = await promise;

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
