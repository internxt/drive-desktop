import { paths } from '@/apps/shared/HttpClient/schema';
import { RemoteSyncedFile } from '../helpers';
import { RemoteSyncManager } from '../RemoteSyncManager';
import { client } from '../../../shared/HttpClient/client';

export class FetchRemoteFilesService {
  async run({
    self,
    updatedAtCheckpoint,
    offset,
    status,
    folderId,
  }: {
    self: RemoteSyncManager;
    folderId?: number;
    updatedAtCheckpoint?: Date;
    offset: number;
    status: string;
  }): Promise<{
    hasMore: boolean;
    result: RemoteSyncedFile[];
  }> {
    const query = {
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

  private getFiles({ query }: { query: paths['/files']['get']['parameters']['query'] }) {
    return client.GET('/files', { params: { query } });
  }

  private async getFilesByFolder({
    folderId,
    query,
  }: {
    folderId: number;
    query: paths['/folders/{id}/files']['get']['parameters']['query'];
  }) {
    const result = await client.GET('/folders/{id}/files', { params: { path: { id: folderId }, query } });
    return { ...result, data: result.data?.result };
  }
}
