import { DriveServerWipModule } from '@/infra/drive-server-wip/drive-server-wip.module';
import { getItemsToSync } from './get-items-to-sync';
import { getItemsToDelete } from './get-items-to-delete';
import { SyncContext } from '@/apps/sync-engine/config';
import { getLocalFiles } from './get-local-files';
import { createOrUpdateFile } from '@/backend/features/remote-sync/update-in-sqlite/create-or-update-file';
import { SqliteModule } from '@/infra/sqlite/sqlite.module';
import { FETCH_LIMIT } from '@/apps/main/remote-sync/store';

type Props = {
  ctx: SyncContext;
  offset: number;
};

export async function filesRecoverySync({ ctx, offset }: Props) {
  const query = {
    limit: FETCH_LIMIT,
    offset,
    status: 'EXISTS' as const,
    sort: 'id',
    order: 'ASC',
  };

  const { data: remotes } = ctx.workspaceId
    ? await DriveServerWipModule.WorkspaceModule.getFilesInWorkspace({ workspaceId: ctx.workspaceId, query })
    : await DriveServerWipModule.FileModule.getFiles({ query });

  if (!remotes) return [];

  const locals = await getLocalFiles({ ctx, remotes });

  if (!locals) return [];

  const filesToSync = getItemsToSync({ ctx, remotes, locals });
  const filesToDelete = getItemsToDelete({ ctx, remotes, locals });

  await Promise.all([
    filesToSync.map((fileDto) => createOrUpdateFile({ context: ctx, fileDto })),
    filesToDelete.map((file) =>
      SqliteModule.FileModule.updateByUuid({
        uuid: file.uuid,
        payload: { status: 'DELETED' },
      }),
    ),
  ]);

  return remotes;
}
