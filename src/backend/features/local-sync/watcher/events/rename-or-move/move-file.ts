import { ipcRendererSqlite } from '@/infra/sqlite/ipc/ipc-renderer';
import { moveItem } from './move-item';
import { FileUuid } from '@/apps/main/database/entities/DriveFile';
import { ProcessSyncContext } from '@/apps/sync-engine/config';
import { AbsolutePath } from '@internxt/drive-desktop-core/build/backend';

type TProps = {
  ctx: ProcessSyncContext;
  path: AbsolutePath;
  uuid: FileUuid;
};

export async function moveFile({ ctx, path, uuid }: TProps) {
  try {
    const { data: item, error } = await ipcRendererSqlite.invoke('fileGetByUuid', { uuid });

    if (error) throw error;

    await moveItem({
      ctx,
      path,
      uuid,
      item,
      itemName: item.nameWithExtension,
      type: 'file',
    });
  } catch (exc) {
    ctx.logger.error({ msg: 'Error moving file', path, uuid, exc });
  }
}
