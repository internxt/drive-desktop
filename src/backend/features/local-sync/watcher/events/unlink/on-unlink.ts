import { AbsolutePath, dirname } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { basename } from 'node:path';
import { ProcessSyncContext } from '@/apps/sync-engine/config';
import { SqliteModule } from '@/infra/sqlite/sqlite.module';
import { deleteFileByUuid, deleteFolderByUuid } from '@/infra/drive-server-wip/out/ipc-main';
import { NodeWin } from '@/infra/node-win/node-win.module';

type Props = {
  ctx: ProcessSyncContext;
  path: AbsolutePath;
  type: 'file' | 'folder';
};

export async function onUnlink({ ctx, path, type }: Props) {
  // Get parent placeholderId from the file explorer.
  const parentPath = dirname(path);
  const { data: parentInfo, error } = await NodeWin.getFolderInfo({ ctx, path: parentPath });
  if (error) throw error;

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
