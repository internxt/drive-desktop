import { client } from '../../../shared/HttpClient/client';
import { FetchFilesService, FetchFilesServiceParams, FetchFilesServiceResult, Query } from './fetch-files.service.interface';

export class FetchRemoteFilesService implements FetchFilesService {
  async run({ self, updatedAtCheckpoint, offset, status = 'ALL', folderId }: FetchFilesServiceParams): Promise<FetchFilesServiceResult> {
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

    throw new Error(`Fetch files response not ok with query ${JSON.stringify(query, null, 2)} and error ${result.error}`);
  }

  private getFiles({ query }: { query: Query }) {
    return client.GET('/files', { params: { query } });
  }

  private async getFilesByFolder({ folderId, query }: { folderId: number; query: Query }) {
    const result = await client.GET('/folders/{id}/files', { params: { path: { id: folderId }, query } });
    return { ...result, data: result.data?.result };
  }
}
