import { driveServerWip } from '@/infra/drive-server-wip/drive-server-wip.module';
import { FolderDto } from '@/infra/drive-server-wip/out/dto';
import { FETCH_LIMIT } from '@/apps/main/remote-sync/store';
import { Config } from '@/apps/sync-engine/config';

type TProps = {
  context: Config;
  folderUuid: string;
};

export async function fetchFoldersByFolder({ context, folderUuid }: TProps) {
  const folders: FolderDto[] = [];
  let hasMore = true;
  let offset = 0;

  while (hasMore) {
    const promise = context.workspaceId ? driveServerWip.workspaces.getFoldersByFolder : driveServerWip.folders.getFoldersByFolder;

    const { data, error } = await promise(
      {
        workspaceId: context.workspaceId,
        workspaceToken: context.workspaceToken,
        folderUuid,
        query: {
          limit: FETCH_LIMIT,
          offset,
          sort: 'updatedAt',
          order: 'DESC',
        },
      },
      { skipLog: true },
    );

    /**
     * v2.5.6 Daniel Jiménez
     * We need to throw the error, otherwise we are going to have an incomplete array of uuids
     * for that folderUuid and we will mark as TRASHED folders that are not TRASHED.
     */
    if (error) throw error;

    hasMore = data.length === FETCH_LIMIT;
    offset += FETCH_LIMIT;

    const filteredData = data.filter((folder) => folder.status === 'EXISTS');
    folders.push(...filteredData);
  }

  return folders;
}
