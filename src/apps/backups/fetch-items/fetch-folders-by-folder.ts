import { driveServerWip } from '@/infra/drive-server-wip/drive-server-wip.module';
import { FETCH_LIMIT_50 } from '@/apps/main/remote-sync/store';
import { SimpleDriveFolder } from '@/apps/main/database/entities/DriveFolder';
import { newParseFolderDto } from '@/infra/drive-server-wip/out/dto';

type TProps = {
  folderUuid: string;
  allFolders: SimpleDriveFolder[];
  abortSignal: AbortSignal;
  newFolders?: SimpleDriveFolder[];
  offset?: number;
};

export async function fetchFoldersByFolder({ folderUuid, allFolders, abortSignal, newFolders = [], offset = 0 }: TProps) {
  let hasMore = true;

  while (hasMore && !abortSignal.aborted) {
    const { data, error } = await driveServerWip.folders.getFoldersByFolder(
      {
        folderUuid,
        query: {
          limit: FETCH_LIMIT_50,
          offset,
          sort: 'updatedAt',
          order: 'DESC',
        },
      },
      { abortSignal },
    );

    if (error) {
      if (error.code === 'ABORTED') return { newFolders };
      throw error;
    }

    hasMore = data.length === FETCH_LIMIT_50;
    offset += FETCH_LIMIT_50;

    const parsedData = data.map((folderDto) => newParseFolderDto({ folderDto }));
    newFolders.push(...parsedData);
    allFolders.push(...parsedData);
  }

  return { newFolders };
}
