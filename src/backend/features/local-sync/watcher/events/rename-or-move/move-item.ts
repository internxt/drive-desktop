import { AbsolutePath, RelativePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { basename } from 'path';
import { Watcher } from '@/node-win/watcher/watcher';
import { FileUuid } from '@/apps/main/database/entities/DriveFile';
import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';
import { ipcRendererDriveServerWip } from '@/infra/drive-server-wip/out/ipc-renderer';
import { getParentUuid } from './get-parent-uuid';
import { ProcessSyncContext } from '@/apps/sync-engine/config';
import { updateFolderStatus } from '../../../placeholders/update-folder-status';
import { updateFileStatus } from '../../../placeholders/update-file-status';

type TProps = {
  ctx: ProcessSyncContext;
  self: Watcher;
  path: RelativePath;
  absolutePath: AbsolutePath;
  item?: {
    oldName: string;
    oldParentUuid: string | undefined;
  };
} & ({ type: 'file'; uuid: FileUuid } | { type: 'folder'; uuid: FolderUuid });

export async function moveItem({ ctx, self, path, absolutePath, uuid, item, type }: TProps) {
  const props = { path, type, uuid };

  const res = getParentUuid({ self, path, props, item });
  if (!res) return;

  const {
    parentUuid,
    existingItem: { oldName, oldParentUuid },
  } = res;

  const name = basename(path);
  const isRenamed = oldName !== name;
  /**
   * v2.5.6 Daniel Jiménez
   * We need to take into account that oldParentUuid can be undefined because
   * for old items it has not been migrated yet in drive-server-wip. In this case
   * we are going to mark it also as moved and we will help to the migration.
   */
  const isMoved = oldParentUuid !== parentUuid;

  const workspaceToken = ctx.workspaceToken;

  if (isRenamed) {
    self.logger.debug({ msg: 'Item renamed', ...props, oldName, name });

    if (type === 'file') {
      await ipcRendererDriveServerWip.invoke('renameFileByUuid', { uuid, nameWithExtension: name, workspaceToken });
    } else {
      await ipcRendererDriveServerWip.invoke('renameFolderByUuid', { uuid, name, workspaceToken });
    }
  }

  if (isMoved) {
    self.logger.debug({ msg: 'Item moved', ...props, oldParentUuid, parentUuid });

    if (type === 'file') {
      await ipcRendererDriveServerWip.invoke('moveFileByUuid', { uuid, parentUuid, nameWithExtension: name, workspaceToken });
    } else {
      await ipcRendererDriveServerWip.invoke('moveFolderByUuid', { uuid, parentUuid, name, workspaceToken });
    }
  }

  if (isRenamed || isMoved) {
    if (type === 'file') {
      updateFileStatus({ ctx, path });
    } else {
      await updateFolderStatus({ ctx, path, absolutePath });
    }
  }
}
