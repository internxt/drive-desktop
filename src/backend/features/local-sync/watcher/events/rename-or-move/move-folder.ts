import { AbsolutePath, RelativePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { ipcRendererSqlite } from '@/infra/sqlite/ipc/ipc-renderer';
import { moveItem } from './move-item';
import { Watcher } from '@/node-win/watcher/watcher';
import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';
import { ProcessSyncContext } from '@/apps/sync-engine/config';

type TProps = {
  ctx: ProcessSyncContext;
  self: Watcher;
  path: RelativePath;
  absolutePath: AbsolutePath;
  uuid: FolderUuid;
};

export async function moveFolder({ ctx, self, path, absolutePath, uuid }: TProps) {
  const { data: item } = await ipcRendererSqlite.invoke('folderGetByUuid', { uuid });

  await moveItem({
    ctx,
    self,
    path,
    absolutePath,
    uuid,
    item,
    type: 'folder',
  });
}
