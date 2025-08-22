import { AbsolutePath, RelativePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { ipcRendererSqlite } from '@/infra/sqlite/ipc/ipc-renderer';
import { moveItem } from './move-item';
import { Watcher } from '@/node-win/watcher/watcher';
import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';

type TProps = {
  self: Watcher;
  path: RelativePath;
  absolutePath: AbsolutePath;
  uuid: FolderUuid;
};

export async function moveFolder({ self, path, absolutePath, uuid }: TProps) {
  try {
    const { data: folder } = await ipcRendererSqlite.invoke('folderGetByUuid', { uuid });

    const item = folder ? { oldParentUuid: folder.parentUuid, oldName: folder.name } : undefined;

    await moveItem({ self, path, absolutePath, uuid, item, type: 'folder' });
  } catch (exc) {
    self.logger.error({ msg: 'Error moving folder', path, uuid, exc });
  }
}
