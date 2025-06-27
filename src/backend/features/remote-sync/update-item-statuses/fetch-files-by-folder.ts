import { driveServerWip } from '@/infra/drive-server-wip/drive-server-wip.module';
import { FileDto } from '@/infra/drive-server-wip/out/dto';
import { FETCH_LIMIT } from '@/apps/main/remote-sync/store';
import { TSyncContext } from '../domain/sync-context';

type TProps = {
  context: TSyncContext;
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

    if (error) throw error;

    hasMore = data.length === FETCH_LIMIT;
    offset += FETCH_LIMIT;

    const filteredData = data.filter((file) => file.status === 'EXISTS');
    files.push(...filteredData);
  }

  return files;
}
