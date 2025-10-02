import { AbsolutePath, RelativePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { basename } from 'node:path';
import { Watcher } from '@/node-win/watcher/watcher';
import { FileUuid, SimpleDriveFile } from '@/apps/main/database/entities/DriveFile';
import { FolderUuid, SimpleDriveFolder } from '@/apps/main/database/entities/DriveFolder';
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
  item?: SimpleDriveFile | SimpleDriveFolder;
} & ({ type: 'file'; uuid: FileUuid } | { type: 'folder'; uuid: FolderUuid });

export async function moveItem({ ctx, self, path, absolutePath, uuid, item, type }: TProps) {
  const parentUuid = getParentUuid({ ctx, self, type, path, item });
  if (!parentUuid) return;

  const workspaceToken = ctx.workspaceToken;
  const name = basename(path);

  self.logger.debug({ msg: 'Item moved', type, path });

  if (type === 'file') {
    await ipcRendererDriveServerWip.invoke('moveFileByUuid', { uuid, parentUuid, nameWithExtension: name, workspaceToken });
  } else {
    await ipcRendererDriveServerWip.invoke('moveFolderByUuid', { uuid, parentUuid, name, workspaceToken });
  }

  if (type === 'file') {
    updateFileStatus({ ctx, path });
  } else {
    await updateFolderStatus({ ctx, path, absolutePath });
  }
}
