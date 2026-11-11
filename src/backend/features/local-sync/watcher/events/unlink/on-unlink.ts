import { basename } from 'node:path';
import { SyncContext } from '@/apps/sync-engine/config';
import { AbsolutePath, dirname } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { deleteFileByUuid, deleteFolderByUuid } from '@/infra/drive-server-wip/out/ipc-main';
import { NodeWin } from '@/infra/node-win/node-win.module';
import { SqliteModule } from '@/infra/sqlite/sqlite.module';

type Props = {
  ctx: SyncContext;
  path: AbsolutePath;
  type: 'file' | 'folder';
};

export async function onUnlink({ ctx, path, type }: Props) {
  // Get parent placeholderId from the file explorer.
  const parentPath = dirname(path);
  const { data: parentInfo } = await NodeWin.getFolderInfo({ ctx, path: parentPath });
  if (!parentInfo) return;

  const parentUuid = parentInfo.uuid;
  const name = basename(path);

  if (type === 'folder') {
    // Since the item is deleted we cannot obtain the placeholderId from the file explorer
    // and we need to obtain it from the sqlite.
    const { data: folder } = await SqliteModule.FolderModule.getByName({ parentUuid, plainName: name });
    if (!folder) return;
    if (isBeingPreserved({ ctx, itemType: 'folder', uuid: folder.uuid })) return;

    ctx.logger.debug({ msg: 'Folder unlinked', path });
    await deleteFolderByUuid({ ctx, path, uuid: folder.uuid });
    return;
  }

  const { data: file } = await SqliteModule.FileModule.getByName({ parentUuid, nameWithExtension: name });
  if (!file) return;
  if (isBeingPreserved({ ctx, itemType: 'file', uuid: file.uuid })) return;

  ctx.logger.debug({ msg: 'File unlinked', path });
  await deleteFileByUuid({ ctx, path, uuid: file.uuid });
}

/**
 * v2.7.2 Alexis Mora
 * Recovery sync moves items out of the sync root before marking them as removed, and the watcher reports that move as a delete,
 * also when the event is queued or arrives late. Those items are skipped so preserving them never sends them to the remote trash.
 * Once the move is done the item is no longer EXISTS, so the lookups by name above already ignore it.
 * If the check fails the delete is skipped too: a skipped delete is undone by the next placeholder refresh, a wrong remote trash is not.
 */
function isBeingPreserved({ ctx, itemType, uuid }: { ctx: SyncContext; itemType: 'file' | 'folder'; uuid: string }) {
  const { data, error } = SqliteModule.RecoverySyncModule.isBeingPreserved({ rootUuid: ctx.rootUuid, itemType, uuid });
  if (!error && !data) return false;

  ctx.logger.debug({ msg: 'Unlink skipped, item is being preserved by recovery sync', itemType, uuid, error });
  return true;
}
