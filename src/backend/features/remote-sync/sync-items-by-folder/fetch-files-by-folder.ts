import { driveServerWip } from '@/infra/drive-server-wip/drive-server-wip.module';
import { ParsedFileDto } from '@/infra/drive-server-wip/out/dto';
import { FETCH_LIMIT } from '@/apps/main/remote-sync/store';
import { SyncContext } from '@/apps/sync-engine/config';
import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';

type TProps = {
  context: SyncContext;
  folderUuid: FolderUuid;
};

export async function fetchFilesByFolder({ context, folderUuid }: TProps) {
  const files: ParsedFileDto[] = [];
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
      { skipLog: true, abortSignal: context.abortController.signal },
    );

    if (error) return null;

    hasMore = data.length === FETCH_LIMIT;
    offset += FETCH_LIMIT;

    const filteredData = data.filter((file) => file.status === 'EXISTS');
    files.push(...filteredData);
  }

  return files;
}
