import { basename } from 'node:path';
import { SyncContext } from '@/apps/sync-engine/config';
import { isInsideUnreconciledFolder } from '@/backend/features/remote-sync/unreconciled-folders';
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
  /**
   * BR-2245
   * Inside a folder that we could not reconcile we never materialized the whole subtree, so
   * a local deletion there does not tell us that the user deleted the remote items: it can
   * also be us failing to keep the placeholders in sync. Propagating it would trash in the
   * server items that never existed locally, so we wait until the folder syncs again.
   */
  if (isInsideUnreconciledFolder({ path })) {
    ctx.logger.warn({ msg: 'Skip unlink inside unreconciled folder', path, type });
    return;
  }

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

    ctx.logger.debug({ msg: 'Folder unlinked', path });
    await deleteFolderByUuid({ ctx, path, uuid: folder.uuid });
    return;
  }

  const { data: file } = await SqliteModule.FileModule.getByName({ parentUuid, nameWithExtension: name });
  if (!file) return;

  ctx.logger.debug({ msg: 'File unlinked', path });
  await deleteFileByUuid({ ctx, path, uuid: file.uuid });
}
