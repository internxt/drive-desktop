import { FetchFoldersService, FetchFoldersServiceParams, FetchFoldersServiceResult } from './fetch-folders.service.interface';
import { driveServerWipModule } from '@/infra/drive-server-wip/drive-server-wip.module';

export class FetchRemoteFoldersService implements FetchFoldersService {
  constructor(private readonly driveServerWip = driveServerWipModule) {}

  async run({ self, updatedAtCheckpoint, folderUuid, offset, status }: FetchFoldersServiceParams): Promise<FetchFoldersServiceResult> {
    const promise = folderUuid
      ? this.driveServerWip.folders.getFoldersByFolder({
          folderUuid,
          query: {
            limit: self.config.fetchFilesLimitPerRequest,
            offset,
            order: 'DESC',
            sort: 'updatedAt',
          },
        })
      : this.driveServerWip.folders.getFolders({
          query: {
            limit: self.config.fetchFilesLimitPerRequest,
            offset,
            status,
            updatedAt: updatedAtCheckpoint?.toISOString(),
          },
        });

    const { data, error } = await promise;

    if (error) throw error;

    const hasMore = data.length === self.config.fetchFilesLimitPerRequest;
    return { hasMore, result: data };
  }
}
