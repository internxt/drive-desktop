import { AbsolutePath, RelativePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { ipcRendererSqlite } from '@/infra/sqlite/ipc/ipc-renderer';
import { moveItem } from './move-item';
import { FileUuid } from '@/apps/main/database/entities/DriveFile';
import { ProcessSyncContext } from '@/apps/sync-engine/config';

type TProps = {
  ctx: ProcessSyncContext;
  path: RelativePath;
  absolutePath: AbsolutePath;
  uuid: FileUuid;
};

export async function moveFile({ ctx, path, absolutePath, uuid }: TProps) {
  try {
    const { data: item, error } = await ipcRendererSqlite.invoke('fileGetByUuid', { uuid });

    if (error) throw error;

    await moveItem({
      ctx,
      path,
      absolutePath,
      uuid,
      item,
      itemName: item.nameWithExtension,
      type: 'file',
    });
  } catch (exc) {
    ctx.logger.error({ msg: 'Error moving file', path, uuid, exc });
  }
}
