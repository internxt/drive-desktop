import { DriveServerWipModule } from '@/infra/drive-server-wip/drive-server-wip.module';
import { getItemsToSync } from './get-items-to-sync';
import { getItemsToDelete } from './get-items-to-delete';
import { SyncContext } from '@/apps/sync-engine/config';
import { getLocalFiles } from './get-local-files';
import { createOrUpdateFile } from '@/backend/features/remote-sync/update-in-sqlite/create-or-update-file';
import { SqliteModule } from '@/infra/sqlite/sqlite.module';

type Props = {
  ctx: SyncContext;
  limit: number;
  offset: number;
};

export async function filesRecoverySync({ ctx, limit, offset }: Props) {
  const query = {
    limit,
    offset,
    status: 'EXISTS' as const,
    sort: 'updatedAt',
    order: 'ASC',
  };

  const { data: remotes } = ctx.workspaceId
    ? await DriveServerWipModule.WorkspaceModule.getFilesInWorkspace({ workspaceId: ctx.workspaceId, query })
    : await DriveServerWipModule.FileModule.getFiles({ query });

  if (!remotes) return [];

  const first = remotes.at(0);
  const last = remotes.at(-1);

  if (!first || !last) return [];

  const locals = await getLocalFiles({ ctx, first, last });

  if (!locals) return [];

  ctx.logger.debug({
    msg: 'Files recovery sync',
    remotes: remotes.length,
    locals: locals.length,
    first: { uuid: first.uuid, name: first.plainName, updatedAt: first.updatedAt },
    last: { uuid: last.uuid, name: last.plainName, updatedAt: last.updatedAt },
  });

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
