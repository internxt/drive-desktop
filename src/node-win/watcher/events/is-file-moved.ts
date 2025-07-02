import { RelativePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { Watcher } from '../watcher';
import { ipcRendererSQLite } from '@/infra/sqlite/ipc/ipc-renderer';
import { isItemMoved } from './is-item-moved';
import { File } from '@/context/virtual-drive/files/domain/File';

type TProps = {
  self: Watcher;
  path: RelativePath;
  uuid: string;
};

export async function isFileMoved({ self, path, uuid }: TProps) {
  try {
    const file = await ipcRendererSQLite.invoke('getFile', { uuid });

    let oldName: string | undefined;
    let oldParentUuid: string | undefined;

    if (file) {
      oldParentUuid = file.folderUuid;
      oldName = File.decryptName({
        plainName: file.plainName,
        name: file.name,
        parentId: file.folderId,
        type: file.type,
      });
    }

    await isItemMoved({
      self,
      path,
      uuid,
      oldName,
      oldParentUuid,
      type: 'file',
    });
  } catch (exc) {
    self.logger.error({
      msg: 'Error checking if file has been moved or renamed',
      path,
      uuid,
      exc,
    });
  }
}
