import { driveServerWip } from '@/infra/drive-server-wip/drive-server-wip.module';
import { newParseFileDto } from '@/infra/drive-server-wip/out/dto';
import { FETCH_LIMIT } from '@/apps/main/remote-sync/store';
import { SimpleDriveFile } from '@/apps/main/database/entities/DriveFile';

type TProps = {
  folderUuid: string;
  allFiles: SimpleDriveFile[];
  abortSignal: AbortSignal;
  offset?: number;
};

export async function fetchFilesByFolder({ folderUuid, allFiles, abortSignal, offset = 0 }: TProps) {
  let hasMore = true;

  while (hasMore && !abortSignal.aborted) {
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

    const parsedData = data.map((fileDto) => newParseFileDto({ fileDto }));
    allFiles.push(...parsedData);
  }
}
