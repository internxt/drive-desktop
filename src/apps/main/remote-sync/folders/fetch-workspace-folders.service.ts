import { paths } from '@/apps/shared/HttpClient/schema';
import { client } from '../../../shared/HttpClient/client';
import { FetchFoldersService, FetchFoldersServiceParams, FetchFoldersServiceResult, Query } from './fetch-folders.service.interface';

export class FetchWorkspaceFoldersService implements FetchFoldersService {
  async run({ self, offset, folderUuid, updatedAtCheckpoint, status }: FetchFoldersServiceParams): Promise<FetchFoldersServiceResult> {
    const query: Query = {
      limit: self.config.fetchFilesLimitPerRequest,
      offset,
      status,
      updatedAt: updatedAtCheckpoint?.toISOString(),
    };
    if (!self.workspaceId) {
      throw new Error('Workspace id is required to fetch folders');
    }

    const promise = folderUuid
      ? this.getFoldersByFolderInWorkspace({
          folderUuid,
          workspaceId: self.workspaceId,
          query: {
            limit: self.config.fetchFilesLimitPerRequest,
            offset,
            order: 'desc',
            sort: 'updatedAt',
          },
        })
      : this.getFoldersInWorkspace({ workspaceId: self.workspaceId, query });

    const result = await promise;

    if (result.data) {
      const hasMore = result.data.length === self.config.fetchFilesLimitPerRequest;
      return { hasMore, result: result.data };
    }

    throw new Error(`Fetch folders response not ok with query ${JSON.stringify(query, null, 2)} and error ${result.error}`);
  }

  private async getFoldersInWorkspace({
    query,
    workspaceId,
  }: {
    workspaceId: string;
    query: paths['/workspaces/{workspaceId}/folders']['get']['parameters']['query'];
  }) {
    const result = await client.GET('/workspaces/{workspaceId}/folders', { params: { path: { workspaceId: workspaceId }, query } });
    return { ...result, data: result.data };
  }

  private async getFoldersByFolderInWorkspace({
    folderUuid,
    workspaceId,
    query,
  }: {
    folderUuid: string;
    workspaceId: string;
    query: paths['/workspaces/{workspaceId}/folders/{folderUuid}/folders']['get']['parameters']['query'];
  }) {
    const result = await client.GET('/workspaces/{workspaceId}/folders/{folderUuid}/folders', {
      params: { path: { workspaceId, folderUuid }, query },
    });
    return { ...result, data: result.data?.result };
  }
}
