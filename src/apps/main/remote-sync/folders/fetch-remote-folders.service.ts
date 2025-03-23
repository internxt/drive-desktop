import { logger } from '@/apps/shared/logger/logger';
import { client } from '../../../shared/HttpClient/client';
import {
  FetchFoldersService,
  FetchFoldersServiceParams,
  FetchFoldersServiceResult,
  Query,
  QueryFolders,
  QueryFoldersInFolder,
} from './fetch-folders.service.interface';

export class FetchRemoteFoldersService implements FetchFoldersService {
  async run({
    self,
    updatedAtCheckpoint,
    folderId,
    offset,
    status = 'ALL',
  }: FetchFoldersServiceParams): Promise<FetchFoldersServiceResult> {
    const query: Query = {
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

    throw logger.error({ msg: 'Fetch folders response not ok', query, error: result.error });
  }

  private getFolders({ query }: { query: QueryFolders }) {
    return client.GET('/folders', { params: { query } });
  }

  private async getFoldersByFolder({ folderId, query }: { folderId: number; query: QueryFoldersInFolder }) {
    const result = await client.GET('/folders/{id}/folders', { params: { path: { id: folderId }, query } });
    return { ...result, data: result.data?.result };
  }
}
