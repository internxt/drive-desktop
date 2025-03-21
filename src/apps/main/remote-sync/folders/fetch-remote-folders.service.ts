import { logger } from '@/apps/shared/logger/logger';
import { client } from '../../../shared/HttpClient/client';
import {
  FetchFoldersService,
  FetchFoldersServiceParams,
  FetchFoldersServiceResult,
  QueryFolders,
  QueryFoldersInFolder,
} from './fetch-folders.service.interface';

export class FetchRemoteFoldersService implements FetchFoldersService {
  async run({
    self,
    updatedAtCheckpoint,
    folderUuid,
    offset,
    status = 'ALL',
  }: FetchFoldersServiceParams): Promise<FetchFoldersServiceResult> {
    const promise = folderUuid
      ? this.getFoldersByFolder({
          folderUuid,
          query: {
            limit: self.config.fetchFilesLimitPerRequest,
            offset,
            order: 'DESC',
            sort: 'updatedAt',
          },
        })
      : this.getFolders({
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

    throw logger.error({ msg: 'Fetch folders response not ok', exc: result.error });
  }

  private getFolders({ query }: { query: QueryFolders }) {
    return client.GET('/folders', { params: { query } });
  }

  private async getFoldersByFolder({ folderUuid, query }: { folderUuid: string; query: QueryFoldersInFolder }) {
    const result = await client.GET('/folders/content/{uuid}/folders', { params: { path: { uuid: folderUuid }, query } });
    return { ...result, data: result.data?.folders };
  }
}
