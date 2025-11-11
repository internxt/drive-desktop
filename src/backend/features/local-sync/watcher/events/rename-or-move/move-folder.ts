import { RelativePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { ipcRendererSqlite } from '@/infra/sqlite/ipc/ipc-renderer';
import { moveItem } from './move-item';
import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';
import { ProcessSyncContext } from '@/apps/sync-engine/config';

type TProps = {
  ctx: ProcessSyncContext;
  path: RelativePath;
  uuid: FolderUuid;
};

export async function moveFolder({ ctx, path, uuid }: TProps) {
  try {
    const { data: item, error } = await ipcRendererSqlite.invoke('folderGetByUuid', { uuid });

    if (error) throw error;

    await moveItem({
      ctx,
      path,
      uuid,
      item,
      itemName: item.name,
      type: 'folder',
    });
  } catch (exc) {
    ctx.logger.error({ msg: 'Error moving folder', path, uuid, exc });
  }
}
