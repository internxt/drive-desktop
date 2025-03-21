import { logger } from '@/apps/shared/logger/logger';
import { client } from '../../../shared/HttpClient/client';
import { FetchFilesService, FetchFilesServiceParams, Query, QueryFiles, QueryFilesInFolder } from './fetch-files.service.interface';

export class FetchRemoteFilesService implements FetchFilesService {
  async run({ self, updatedAtCheckpoint, offset, status = 'ALL', folderId }: FetchFilesServiceParams) {
    const query: Query = {
      limit: self.config.fetchFilesLimitPerRequest,
      offset,
      status,
      updatedAt: updatedAtCheckpoint?.toISOString(),
    };

    const promise = folderId ? this.getFilesByFolder({ folderId, query }) : this.getFiles({ query });

    const result = await promise;

    if (result.data) {
      const hasMore = result.data.length === self.config.fetchFilesLimitPerRequest;
      return { hasMore, result: result.data };
    }

    throw logger.error({ msg: 'Fetch files response not ok', query, error: result.error });
  }

  private getFiles({ query }: { query: QueryFiles }) {
    return client.GET('/files', { params: { query } });
  }

  private async getFilesByFolder({ folderId, query }: { folderId: number; query: QueryFilesInFolder }) {
    const result = await client.GET('/folders/{id}/files', { params: { path: { id: folderId }, query } });
    return { ...result, data: result.data?.result };
  }
}
