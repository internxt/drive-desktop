import { DriveServerWipModule } from '@/infra/drive-server-wip/drive-server-wip.module';
import { SqliteModule } from '@/infra/sqlite/sqlite.module';
import { getItemsToSync } from './get-items-to-sync';
import { getItemsToDelete } from './get-items-to-delete';
import { SyncContext } from '@/apps/sync-engine/config';
import { createOrUpdateFile } from '@/backend/features/remote-sync/update-in-sqlite/create-or-update-file';

type Props = {
  ctx: SyncContext;
  limit: number;
  offset: number;
};

export async function filesRecoverySync({ ctx, limit, offset }: Props) {
  const query = { limit, offset, status: 'EXISTS' as const };

  const { data: remoteFiles } = ctx.workspaceId
    ? await DriveServerWipModule.WorkspaceModule.getFilesInWorkspace({ workspaceId: ctx.workspaceId, query })
    : await DriveServerWipModule.FileModule.getFiles({ query });

  if (!remoteFiles) return [];

  const first = remoteFiles.at(0);
  const last = remoteFiles.at(-1);

  if (!first || !last) return [];

  const { data: localFiles } = await SqliteModule.FileModule.getByUpdatedAt({
    workspaceId: ctx.workspaceId,
    from: first.updatedAt,
    to: last.updatedAt,
  });

  if (!localFiles) return [];

  ctx.logger.debug({
    msg: 'Files recovery sync',
    remotes: remoteFiles.length,
    locals: remoteFiles.length,
    first: { name: first.plainName, updatedAt: first.updatedAt },
    last: { name: last.plainName, updatedAt: last.updatedAt },
  });

  const filesToSync = getItemsToSync({ ctx, remotes: remoteFiles, locals: localFiles });
  const filesToDelete = getItemsToDelete({ ctx, remotes: remoteFiles, locals: localFiles });

  await Promise.all([
    filesToSync.map((fileDto) => createOrUpdateFile({ context: ctx, fileDto })),
    filesToDelete.map((file) =>
      SqliteModule.FileModule.updateByUuid({
        uuid: file.uuid,
        payload: { status: 'DELETED' },
      }),
    ),
  ]);

  return remoteFiles;
}
