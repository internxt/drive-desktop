import { paths } from '@/apps/shared/HttpClient/schema';
import { RemoteSyncedFolder } from '../helpers';
import { RemoteSyncManager } from '../RemoteSyncManager';
import { client } from '../../../shared/HttpClient/client';

export class FetchRemoteFoldersService {
  async run({
    self,
    updatedAtCheckpoint,
    folderId,
    offset,
    status,
  }: {
    self: RemoteSyncManager;
    folderId?: number;
    updatedAtCheckpoint?: Date;
    offset: number;
    status: string;
  }): Promise<{
    hasMore: boolean;
    result: RemoteSyncedFolder[];
  }> {
    const query = {
      limit: self.config.fetchFilesLimitPerRequest,
      offset,
      status,
      updatedAt: updatedAtCheckpoint?.toISOString(),
    };

    const promise = folderId ? this.getFoldersByFolder({ folderId, query }) : this.getFolders({ query });
    const result = await promise;

    if (result.data) {
      const hasMore = result.data.length === self.config.fetchFilesLimitPerRequest;
      return { hasMore, result: result.data };
    }

    throw new Error(`Fetch folders response not ok with query ${JSON.stringify(query, null, 2)} and error ${result.error}`);
  }

  private getFolders({ query }: { query: paths['/folders']['get']['parameters']['query'] }) {
    return client.GET('/folders', { params: { query } });
  }

  private async getFoldersByFolder({
    folderId,
    query,
  }: {
    folderId: number;
    query: paths['/folders/{id}/folders']['get']['parameters']['query'];
  }) {
    const result = await client.GET('/folders/{id}/folders', { params: { path: { id: folderId }, query } });
    return { ...result, data: result.data?.result };
  }
}
