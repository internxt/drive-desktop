import { logger } from '@/apps/shared/logger/logger';
import { driveServerWip } from '@/infra/drive-server-wip/drive-server-wip.module';
import { FolderDto } from '@/infra/drive-server-wip/out/dto';
import { FETCH_LIMIT } from '@/apps/main/remote-sync/store';
import { retryWrapper } from '@/infra/drive-server-wip/out/retry-wrapper';

type TProps = {
  folderUuid: string;
  allFolders: FolderDto[];
  abortSignal: AbortSignal;
  newFolders?: FolderDto[];
  retry?: number;
  offset?: number;
};

export async function fetchFoldersByFolder({ folderUuid, allFolders, abortSignal, newFolders = [], offset = 0 }: TProps) {
  let hasMore = true;

  while (hasMore && !abortSignal.aborted) {
    logger.debug({
      msg: 'Fetching backup folders',
      folderUuid,
      offset,
    });

    const promise = () =>
      driveServerWip.folders.getFoldersByFolder({
        folderUuid,
        query: {
          limit: FETCH_LIMIT,
          offset,
          sort: 'updatedAt',
          order: 'DESC',
        },
      });

    const { data, error } = await retryWrapper({
      promise,
      loggerBody: {
        tag: 'BACKUPS',
        msg: 'Retry fetching folders by folder',
      },
    });

    if (!data) throw error;

    hasMore = data.length === FETCH_LIMIT;
    offset += FETCH_LIMIT;

    const filteredData = data.filter((folder) => folder.status === 'EXISTS');
    newFolders.push(...filteredData);
    allFolders.push(...filteredData);
  }

  return { newFolders };
}
