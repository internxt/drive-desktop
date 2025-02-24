import { paths } from '@/apps/shared/HttpClient/schema';
import { client } from '../../../shared/HttpClient/client';
import { FetchFilesService, FetchFilesServiceParams, FetchFilesServiceResult, Query } from './fetch-files.service.interface';

export class FetchWorkspaceFilesService implements FetchFilesService {
  async run({ self, offset, folderUuid, updatedAtCheckpoint, status }: FetchFilesServiceParams): Promise<FetchFilesServiceResult> {
    const query: Query = {
      limit: self.config.fetchFilesLimitPerRequest,
      offset,
      status,
      updatedAt: updatedAtCheckpoint?.toISOString(),
    };
    if (!self.workspaceId) {
      throw new Error('Workspace id is required to fetch files');
    }

    const promise = folderUuid
      ? this.getFilesByFolderInWorkspace({
          folderUuid,
          workspaceId: self.workspaceId,
          query: {
            limit: self.config.fetchFilesLimitPerRequest,
            offset,
            order: 'desc',
            sort: 'updatedAt',
          },
        })
      : this.getFileInWorkspace({ workspaceId: self.workspaceId, query });

    const result = await promise;

    if (result.data) {
      const hasMore = result.data.length === self.config.fetchFilesLimitPerRequest;
      return { hasMore, result: result.data };
    }

    throw new Error(`Fetch files response not ok with query ${JSON.stringify(query, null, 2)} and error ${result.error}`);
  }

  private async getFileInWorkspace({
    query,
    workspaceId,
  }: {
    workspaceId: string;
    query: paths['/workspaces/{workspaceId}/files']['get']['parameters']['query'];
  }) {
    const result = await client.GET('/workspaces/{workspaceId}/files', { params: { path: { workspaceId: workspaceId }, query } });
    return { ...result, data: result.data };
  }

  private async getFilesByFolderInWorkspace({
    folderUuid,
    workspaceId,
    query,
  }: {
    folderUuid: string;
    workspaceId: string;
    query: paths['/workspaces/{workspaceId}/folders/{folderUuid}/files']['get']['parameters']['query'];
  }) {
    const result = await client.GET('/workspaces/{workspaceId}/folders/{folderUuid}/files', {
      params: { path: { workspaceId, folderUuid }, query },
    });
    return { ...result, data: result.data?.result };
  }
}
