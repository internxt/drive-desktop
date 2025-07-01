import { RelativePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { Watcher } from '../watcher';
import { ipcRendererSQLite } from '@/infra/sqlite/ipc/ipc-renderer';
import { isItemMoved } from './is-item-moved';
import { Folder } from '@/context/virtual-drive/folders/domain/Folder';

type TProps = {
  self: Watcher;
  path: RelativePath;
  uuid: string;
};

export async function isFolderMoved({ self, path, uuid }: TProps) {
  try {
    const folder = await ipcRendererSQLite.invoke('getFolder', { uuid });

    let oldName: string | undefined;
    let oldParentUuid: string | undefined;

    if (folder) {
      oldParentUuid = folder.parentUuid;
      oldName = Folder.decryptName({
        plainName: folder.plainName,
        name: folder.name,
        parentId: folder.parentId,
      });
    }

    await isItemMoved({
      self,
      path,
      uuid,
      oldName,
      oldParentUuid,
      type: 'folder',
    });
  } catch (exc) {
    self.logger.error({
      msg: 'Error checking if folder has been moved or renamed',
      path,
      uuid,
      exc,
    });
  }
}
