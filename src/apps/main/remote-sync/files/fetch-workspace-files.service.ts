import { logger } from '@/apps/shared/logger/logger';
import { driveServerWip } from '@/infra/drive-server-wip/drive-server-wip.module';
import { FetchFilesServiceParams } from './fetch-files.service.interface';
import { FETCH_LIMIT } from '../store';

export async function fetchWorkspaceFiles({ self, offset, folderUuid, updatedAtCheckpoint, status }: FetchFilesServiceParams) {
  if (!self.workspaceId) {
    throw new Error('Workspace id is required to fetch files');
  }

  const promise = folderUuid
    ? driveServerWip.workspaces.getFilesByFolderInWorkspace({
        folderUuid,
        workspaceId: self.workspaceId,
        query: {
          limit: FETCH_LIMIT,
          offset,
          sort: 'updatedAt',
          order: 'DESC',
        },
      })
    : driveServerWip.workspaces.getFilesInWorkspace({
        workspaceId: self.workspaceId,
        query: {
          limit: FETCH_LIMIT,
          offset,
          status,
          updatedAt: updatedAtCheckpoint?.toISOString(),
        },
      });

  const result = await promise;

  if (result.data) {
    const hasMore = result.data.length === FETCH_LIMIT;
    return { hasMore, result: result.data };
  }

  throw logger.error({ msg: 'Fetch workspace files response not ok', error: result.error });
}
