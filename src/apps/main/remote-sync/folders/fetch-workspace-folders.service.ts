import { logger } from '@/apps/shared/logger/logger';
import { client } from '../../../shared/HttpClient/client';
import {
  FetchFoldersService,
  FetchFoldersServiceParams,
  FetchFoldersServiceResult,
  QueryFoldersInFolderInWorkspace,
  QueryFoldersInWorkspace,
  QueryWorkspace,
} from './fetch-folders.service.interface';
import { FETCH_LIMIT } from '../store';

export class FetchWorkspaceFoldersService implements FetchFoldersService {
  async run({ self, offset, folderUuid }: FetchFoldersServiceParams): Promise<FetchFoldersServiceResult> {
    if (!self.workspaceId) {
      throw new Error('Workspace id is required to fetch folders');
    }
    const query: QueryWorkspace = {
      limit: FETCH_LIMIT,
      offset,
      order: 'DESC',
      sort: 'updatedAt',
    };

    const promise = folderUuid
      ? this.getFoldersByFolderInWorkspace({
          folderUuid,
          workspaceId: self.workspaceId,
          query,
        })
      : this.getFoldersInWorkspace({ workspaceId: self.workspaceId, query });

    const result = await promise;

    if (result.data) {
      const hasMore = result.data.length === FETCH_LIMIT;
      return { hasMore, result: result.data };
    }

    throw logger.error({ msg: 'Fetch workspace folders response not ok', query, error: result.error });
  }

  private async getFoldersInWorkspace({ query, workspaceId }: { workspaceId: string; query: QueryFoldersInWorkspace }) {
    const result = await client.GET('/workspaces/{workspaceId}/folders', { params: { path: { workspaceId }, query } });
    return { ...result, data: result.data };
  }

  private async getFoldersByFolderInWorkspace({
    folderUuid,
    workspaceId,
    query,
  }: {
    folderUuid: string;
    workspaceId: string;
    query: QueryFoldersInFolderInWorkspace;
  }) {
    const result = await client.GET('/workspaces/{workspaceId}/folders/{folderUuid}/folders', {
      params: { path: { workspaceId, folderUuid }, query },
    });
    return { ...result, data: result.data?.result };
  }
}
