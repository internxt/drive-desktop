import { RelativePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { basename, extname } from 'path';
import { Watcher } from '@/node-win/watcher/watcher';
import { FileUuid } from '@/apps/main/database/entities/DriveFile';
import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';
import { ipcRendererDriveServerWip } from '@/infra/drive-server-wip/out/ipc-renderer';
import { getParentUuid } from './get-parent-uuid';

type TProps = {
  self: Watcher;
  path: RelativePath;
  uuid: FileUuid | FolderUuid;
  type: 'file' | 'folder';
  item?: {
    oldName: string;
    oldParentUuid: string | undefined;
  };
};

export async function moveItem({ self, path, uuid, item, type }: TProps) {
  const props = { path, type, uuid };

  const res = getParentUuid({ self, path, props, item });
  if (!res) return;

  const {
    parentUuid,
    existingItem: { oldName, oldParentUuid },
  } = res;

  const name = basename(path);
  const isRenamed = oldName !== name;
  const isMoved = oldParentUuid !== parentUuid;

  if (isRenamed) {
    self.logger.debug({ msg: 'Item renamed', ...props, oldName, name });

    if (type === 'file') {
      const extension = extname(name);
      const nameWithoutExtension = basename(name, extension);
      await ipcRendererDriveServerWip.invoke('renameFileByUuid', { uuid, name: nameWithoutExtension, type: extension.slice(1) });
    } else {
      await ipcRendererDriveServerWip.invoke('renameFolderByUuid', { uuid, plainName: name });
    }
  }

  if (isMoved) {
    self.logger.debug({ msg: 'Item moved', ...props, oldParentUuid, parentUuid });

    if (type === 'file') {
      await ipcRendererDriveServerWip.invoke('moveFileByUuid', { uuid, parentUuid });
    } else {
      await ipcRendererDriveServerWip.invoke('moveFolderByUuid', { uuid, parentUuid });
    }
  }

  if ((isRenamed || isMoved) && type === 'file') {
    self.virtualDrive.updateSyncStatus({ itemPath: path, isDirectory: false, sync: true });
  }
}
