import { DriveServerWipModule } from '@/infra/drive-server-wip/drive-server-wip.module';
import { getItemsToSync } from './get-items-to-sync';
import { getDeletedItems } from './get-deleted-items';
import { SyncContext } from '@/apps/sync-engine/config';
import { getLocalFiles } from './get-local-files';
import { createOrUpdateFile } from '@/backend/features/remote-sync/update-in-sqlite/create-or-update-file';
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

  // eslint-disable-next-line array-callback-return
  const deletedFilesPromises = deletedFiles.map(() => {
    /**
     * v2.6.0 Daniel Jiménez
     * This should never happen. Basically if we reach this point it means that there was an
     * item in web that is marked as TRASHED/DELETED but as EXISTS in local. We are going to
     * try upload it again since it's better to not remove anything locally.
     * TODO: check if we can upload from here without doing an ipc call.
     */
  });

  await Promise.all([filesToSyncPromises, deletedFilesPromises]);

  return remotes;
}
