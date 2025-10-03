import { driveServerWip } from '@/infra/drive-server-wip/drive-server-wip.module';
import { ParsedFolderDto } from '@/infra/drive-server-wip/out/dto';
import { FETCH_LIMIT_50 } from '@/apps/main/remote-sync/store';
import { SyncContext } from '@/apps/sync-engine/config';

type TProps = {
  context: SyncContext;
  folderUuid: string;
};

export async function fetchFoldersByFolder({ context, folderUuid }: TProps) {
  const folders: ParsedFolderDto[] = [];
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
          limit: FETCH_LIMIT_50,
          offset,
          sort: 'updatedAt',
          order: 'DESC',
        },
      },
      { skipLog: true, abortSignal: context.abortController.signal },
    );

    if (error) return null;

    hasMore = data.length === FETCH_LIMIT_50;
    offset += FETCH_LIMIT_50;

    const filteredData = data.filter((folder) => folder.status === 'EXISTS');
    folders.push(...filteredData);
  }

  return folders;
}
