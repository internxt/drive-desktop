import { logger } from '@/apps/shared/logger/logger';
import { client } from '../../../shared/HttpClient/client';
import { FetchFilesService, FetchFilesServiceParams, QueryFiles, QueryFilesInFolder } from './fetch-files.service.interface';

export class FetchRemoteFilesService implements FetchFilesService {
  async run({ self, updatedAtCheckpoint, offset, status = 'ALL', folderUuid }: FetchFilesServiceParams) {
    const promise = folderUuid
      ? this.getFilesByFolder({
          folderUuid,
          query: {
            limit: self.config.fetchFilesLimitPerRequest,
            offset,
            sort: 'updatedAt',
            order: 'DESC',
          },
        })
      : this.getFiles({
          query: {
            limit: self.config.fetchFilesLimitPerRequest,
            offset,
            status,
            updatedAt: updatedAtCheckpoint?.toISOString(),
          },
        });

    const result = await promise;

    if (result.data) {
      const hasMore = result.data.length === self.config.fetchFilesLimitPerRequest;
      return { hasMore, result: result.data };
    }

    throw logger.error({ msg: 'Fetch files response not ok', exc: result.error, folderUuid });
  }

  private getFiles({ query }: { query: QueryFiles }) {
    return client.GET('/files', { params: { query } });
  }

  private async getFilesByFolder({ folderUuid, query }: { folderUuid: string; query: QueryFilesInFolder }) {
    const result = await client.GET('/folders/content/{uuid}/files', { params: { path: { uuid: folderUuid }, query } });
    return { ...result, data: result.data?.files };
  }
}
