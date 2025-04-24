import { FETCH_LIMIT } from '../store';
import { FetchFilesServiceParams } from './fetch-files.service.interface';
import { driveServerWip } from '@/infra/drive-server-wip/drive-server-wip.module';

export async function fetchRemoteFiles({ updatedAtCheckpoint, offset, status, folderUuid }: FetchFilesServiceParams) {
  const promise = folderUuid
    ? driveServerWip.folders.getFiles({
        folderUuid,
        query: {
          limit: FETCH_LIMIT,
          offset,
          sort: 'updatedAt',
          order: 'DESC',
        },
      })
    : driveServerWip.files.getFiles({
        query: {
          limit: FETCH_LIMIT,
          offset,
          status,
          updatedAt: updatedAtCheckpoint?.toISOString(),
        },
      });

  const { data, error } = await promise;

  if (error) throw error;

  const hasMore = data.length === FETCH_LIMIT;
  return { hasMore, result: data };
}
