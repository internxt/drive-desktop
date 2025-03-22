import { logger } from '@/apps/shared/logger/logger';
import { client } from '../../../shared/HttpClient/client';
import {
  FetchFilesService,
  FetchFilesServiceParams,
  QueryFilesInFolderInWorkspace,
  QueryFilesInWorkspace,
  QueryWorkspace,
} from './fetch-files.service.interface';
import { FETCH_FILES_LIMIT_PER_REQUEST } from '../store';

export class FetchWorkspaceFilesService implements FetchFilesService {
  async run({ self, offset, folderUuid }: FetchFilesServiceParams) {
    if (!self.workspaceId) {
      throw new Error('Workspace id is required to fetch files');
    }

    const query: QueryWorkspace = {
      limit: FETCH_FILES_LIMIT_PER_REQUEST,
      offset,
      sort: 'updatedAt',
      order: 'DESC',
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
      const hasMore = result.data.length === FETCH_FILES_LIMIT_PER_REQUEST;
      return { hasMore, result: result.data };
    }

    throw logger.error({ msg: 'Fetch workspace files response not ok', query, error: result.error });
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
