import { logger } from '@/apps/shared/logger/logger';
import { driveServerWip } from '@/infra/drive-server-wip/drive-server-wip.module';
import { FileDto } from '@/infra/drive-server-wip/out/dto';
import { FETCH_LIMIT } from '@/apps/main/remote-sync/store';

type TProps = {
  folderUuid: string;
  allFiles: FileDto[];
  abortSignal: AbortSignal;
  offset?: number;
};

export async function fetchFilesByFolder({ folderUuid, allFiles, abortSignal, offset = 0 }: TProps) {
  let hasMore = true;

  while (hasMore && !abortSignal.aborted) {
    logger.debug({
      tag: 'BACKUPS',
      msg: 'Fetching backup files',
      folderUuid,
      offset,
    });

    const { data, error } = await driveServerWip.folders.getFilesByFolder(
      {
        folderUuid,
        query: {
          limit: FETCH_LIMIT,
          offset,
          sort: 'updatedAt',
          order: 'DESC',
        },
      },
      { abortSignal },
    );

    if (error) {
      if (error.code === 'ABORTED') return;
      throw error;
    }

    hasMore = data.length === FETCH_LIMIT;
    offset += FETCH_LIMIT;

    const filteredData = data.filter((file) => file.status === 'EXISTS');
    allFiles.push(...filteredData);
  }
}
