import { FetchFilesService, FetchFilesServiceParams } from './fetch-files.service.interface';
import { driveServerWipModule } from '@/infra/drive-server-wip/drive-server-wip.module';

export class FetchRemoteFilesService implements FetchFilesService {
  constructor(private readonly driveServerWip = driveServerWipModule) {}

  async run({ self, updatedAtCheckpoint, offset, status, folderUuid }: FetchFilesServiceParams) {
    const promise = folderUuid
      ? this.driveServerWip.folders.getFiles({
          folderUuid,
          query: {
            limit: self.config.fetchFilesLimitPerRequest,
            offset,
            sort: 'updatedAt',
            order: 'DESC',
          },
        })
      : this.driveServerWip.files.getFiles({
          query: {
            limit: self.config.fetchFilesLimitPerRequest,
            offset,
            status,
            updatedAt: updatedAtCheckpoint?.toISOString(),
          },
        });

    const data = await promise;

    const hasMore = data.length === self.config.fetchFilesLimitPerRequest;
    return { hasMore, result: data };
  }
}
