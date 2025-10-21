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

  if (remotes === undefined) return [];

  const locals = await getLocalFiles({ ctx, remotes });

  if (locals === undefined) return [];

  const filesToSync = getItemsToSync({ ctx, remotes, locals });
  const deletedFiles = getDeletedItems({ ctx, remotes, locals });

  const filesToSyncPromises = filesToSync.map((fileDto) => createOrUpdateFile({ context: ctx, fileDto }));

  const deletedFilesPromises = deletedFiles.map((file) => {
    if (!file.parentUuid) {
      ctx.logger.error({
        msg: 'File does not have parentUuid and cannot be recreated',
        uuid: file.uuid,
      });

      return Promise.resolve();
    }

    /**
     * v2.6.0 Daniel Jiménez
     * This should never happen. Basically if we reach this point it means that there was an
     * item in web that is marked as TRASHED/DELETED but as EXISTS in local. We are going to
     * try to mark it as EXISTS in web since it's better to not remove anything locally.
     */
    return DriveServerWipModule.FileModule.move({
      uuid: file.uuid,
      parentUuid: file.parentUuid,
      name: file.name,
      extension: file.extension,
      workspaceToken: ctx.workspaceToken,
    });
  });

  await Promise.all([filesToSyncPromises, deletedFilesPromises]);

  return remotes;
}
