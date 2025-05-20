import { logger } from '@/apps/shared/logger/logger';
import { driveServerWip } from '@/infra/drive-server-wip/drive-server-wip.module';
import { FileDto } from '@/infra/drive-server-wip/out/dto';
import { FETCH_LIMIT } from '@/apps/main/remote-sync/store';
import { retryWrapper } from '@/infra/drive-server-wip/out/retry-wrapper';

type TProps = {
  folderUuid: string;
  allFiles: FileDto[];
  offset?: number;
};

export async function fetchFilesByFolder({ folderUuid, allFiles, offset = 0 }: TProps) {
  let hasMore = true;

  while (hasMore) {
    logger.debug({
      msg: 'Fetching backup files',
      folderUuid,
      offset,
    });

    const promise = () =>
      driveServerWip.folders.getFilesByFolder({
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
        msg: 'Retry fetching files by folder',
      },
    });

    if (!data) throw error;

    hasMore = data.length === FETCH_LIMIT;
    offset += FETCH_LIMIT;

    const filteredData = data.filter((file) => file.status === 'EXISTS');
    allFiles.push(...filteredData);
  }
}
