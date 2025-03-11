import { client } from '../../../shared/HttpClient/client';
import {
  FetchFilesService,
  FetchFilesServiceParams,
  FetchFilesServiceResult,
  QueryFilesInFolderInWorkspace,
  QueryFilesInWorkspace,
  QueryWorkspace,
} from './fetch-files.service.interface';

export class FetchWorkspaceFilesService implements FetchFilesService {
  async run({ self, offset, folderUuid }: FetchFilesServiceParams): Promise<FetchFilesServiceResult> {
    if (!self.workspaceId) {
      throw new Error('Workspace id is required to fetch files');
    }

    const query: QueryWorkspace = {
      limit: self.config.fetchFilesLimitPerRequest,
      offset,
      sort: 'updatedAt',
      order: 'desc',
    };

    const promise = folderUuid
      ? this.getFilesByFolderInWorkspace({
          folderUuid,
          workspaceId: self.workspaceId,
          query,
        })
      : this.getFileInWorkspace({ workspaceId: self.workspaceId, query });

    const result = await promise;

    if (result.data) {
      const hasMore = result.data.length === self.config.fetchFilesLimitPerRequest;
      return { hasMore, result: result.data };
    }

    throw new Error(`Fetch files response not ok with query ${JSON.stringify(query, null, 2)} and error ${result.error}`);
  }

  private async getFileInWorkspace({ query, workspaceId }: { workspaceId: string; query: QueryFilesInWorkspace }) {
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
    query: QueryFilesInFolderInWorkspace;
  }) {
    const result = await client.GET('/workspaces/{workspaceId}/folders/{folderUuid}/files', {
      params: { path: { workspaceId, folderUuid }, query },
    });
    return { ...result, data: result.data?.result };
  }
}
