import { DriveServerWipModule } from '@/infra/drive-server-wip/drive-server-wip.module';
import { getItemsToSync } from './get-items-to-sync';
import { getDeletedItems } from './get-deleted-items';
import { SyncContext } from '@/apps/sync-engine/config';
import { getLocalFiles } from './get-local-files';
import { createOrUpdateFile } from '@/backend/features/remote-sync/update-in-sqlite/create-or-update-file';
import { FETCH_LIMIT } from '@/apps/main/remote-sync/store';
import { SqliteModule } from '@/infra/sqlite/sqlite.module';

type Props = {
  ctx: SyncContext;
  offset: number;
};

export async function filesRecoverySync({ ctx, offset }: Props) {
  const query = {
    limit: FETCH_LIMIT,
    offset,
    status: 'EXISTS' as const,
    sort: 'uuid',
    order: 'ASC',
  };

  const { data: remotes } = ctx.workspaceId
    ? await DriveServerWipModule.WorkspaceModule.getFilesInWorkspace({ workspaceId: ctx.workspaceId, query })
    : await DriveServerWipModule.FileModule.getFiles({ query });

  if (!remotes) return [];

  const locals = await getLocalFiles({ ctx, remotes });

  if (!locals) return [];

  const filesToSync = getItemsToSync({ ctx, remotes, locals });
  const deletedFiles = getDeletedItems({ ctx, remotes, locals });

  const filesToSyncPromises = filesToSync.map((fileDto) => createOrUpdateFile({ context: ctx, fileDto }));
  const deletedFilesPromises = deletedFiles.map((file) =>
    SqliteModule.FileModule.updateByUuid({
      uuid: file.uuid,
      payload: { status: 'DELETED' },
    }),
  );

  await Promise.all([filesToSyncPromises, deletedFilesPromises]);

  return remotes;
}
