import { logger } from '@/apps/shared/logger/logger';
import { client } from '../../../shared/HttpClient/client';
import {
  FetchFilesService,
  FetchFilesServiceParams,
  QueryFilesInFolderInWorkspace,
  QueryFilesInWorkspace,
} from './fetch-files.service.interface';

export class FetchWorkspaceFilesService implements FetchFilesService {
  async run({ self, offset, folderUuid, updatedAtCheckpoint, status }: FetchFilesServiceParams) {
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
            sort: 'updatedAt',
            order: 'DESC',
          },
        })
      : this.getFileInWorkspace({
          workspaceId: self.workspaceId,
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

    throw logger.error({ msg: 'Fetch workspace files response not ok', error: result.error });
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
