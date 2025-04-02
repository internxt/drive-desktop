import { FETCH_LIMIT } from '../store';
import { FetchFoldersService, FetchFoldersServiceParams, FetchFoldersServiceResult } from './fetch-folders.service.interface';
import { driveServerWipModule } from '@/infra/drive-server-wip/drive-server-wip.module';

export class FetchRemoteFoldersService implements FetchFoldersService {
  constructor(private readonly driveServerWip = driveServerWipModule) {}

  async run({ updatedAtCheckpoint, folderUuid, offset, status }: FetchFoldersServiceParams): Promise<FetchFoldersServiceResult> {
    const promise = folderUuid
      ? this.driveServerWip.folders.getFoldersByFolder({
          folderUuid,
          query: {
            limit: FETCH_LIMIT,
            offset,
            order: 'DESC',
            sort: 'updatedAt',
          },
        })
      : this.driveServerWip.folders.getFolders({
          query: {
            limit: FETCH_LIMIT,
            offset,
            status,
            updatedAt: updatedAtCheckpoint?.toISOString(),
          },
        });

    const { data, error } = await promise;

    if (error) throw error;

    const hasMore = data.length === FETCH_LIMIT;
    return { hasMore, result: data };
  }
}
