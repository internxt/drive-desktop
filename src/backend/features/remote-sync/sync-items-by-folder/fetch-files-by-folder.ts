import { driveServerWip } from '@/infra/drive-server-wip/drive-server-wip.module';
import { FileDto } from '@/infra/drive-server-wip/out/dto';
import { FETCH_LIMIT } from '@/apps/main/remote-sync/store';
import { Config } from '@/apps/sync-engine/config';

type TProps = {
  context: Config;
  folderUuid: string;
};

export async function fetchFilesByFolder({ context, folderUuid }: TProps) {
  const files: FileDto[] = [];
  let hasMore = true;
  let offset = 0;

  while (hasMore) {
    const promise = context.workspaceId ? driveServerWip.workspaces.getFilesByFolder : driveServerWip.folders.getFilesByFolder;

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

    const filteredData = data.filter((file) => file.status === 'EXISTS');
    files.push(...filteredData);
  }

  return files;
}
