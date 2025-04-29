import { logger } from '@/apps/shared/logger/logger';
import { driveServerWip } from '@/infra/drive-server-wip/drive-server-wip.module';
import { sleep } from '@/apps/main/util';
import { FileDto } from '@/infra/drive-server-wip/out/dto';
import { FETCH_LIMIT } from '../store';

type TProps = {
  folderUuid: string;
  retry?: number;
  offset?: number;
  allResults?: FileDto[];
};

const MAX_RETRIES = 3;

export async function fetchBackupFiles({ folderUuid, retry = 1, offset = 0, allResults = [] }: TProps): Promise<FileDto[]> {
  let hasMore = true;

  try {
    while (hasMore) {
      logger.debug({
        msg: 'Fetching backup files',
        folderUuid,
        offset,
      });

      const { data, error } = await driveServerWip.folders.getFilesByFolder({
        folderUuid,
        query: {
          limit: FETCH_LIMIT,
          offset,
          sort: 'updatedAt',
          order: 'DESC',
        },
      });

      if (error) throw error;

      hasMore = data.length === FETCH_LIMIT;
      offset += FETCH_LIMIT;
      allResults.push(...data);
    }

    return allResults;
  } catch (exc) {
    logger.error({ msg: 'Fetch backup files failed', exc, retry, offset });

    if (retry >= MAX_RETRIES) {
      throw new Error('Fetch backup files failed because of max retries');
    }

    await sleep(5000);
    return await fetchBackupFiles({
      folderUuid,
      retry: retry + 1,
      offset,
      allResults,
    });
  }
}
