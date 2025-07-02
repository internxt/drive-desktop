import { driveServerWip } from '@/infra/drive-server-wip/drive-server-wip.module';
import { FolderDto } from '@/infra/drive-server-wip/out/dto';
import { FETCH_LIMIT } from '@/apps/main/remote-sync/store';

type TProps = {
  folderUuid: string;
  allFolders: FolderDto[];
  abortSignal: AbortSignal;
  newFolders?: FolderDto[];
  offset?: number;
};

export async function fetchFoldersByFolder({ folderUuid, allFolders, abortSignal, newFolders = [], offset = 0 }: TProps) {
  let hasMore = true;

  while (hasMore && !abortSignal.aborted) {
    const { data, error } = await driveServerWip.folders.getFoldersByFolder(
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
      if (error.code === 'ABORTED') return { newFolders };
      throw error;
    }

    hasMore = data.length === FETCH_LIMIT;
    offset += FETCH_LIMIT;

    const filteredData = data.filter((folder) => folder.status === 'EXISTS');
    newFolders.push(...filteredData);
    allFolders.push(...filteredData);
  }

  return { newFolders };
}
