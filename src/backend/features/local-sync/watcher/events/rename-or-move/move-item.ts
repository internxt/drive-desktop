import { AbsolutePath, pathUtils, RelativePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { basename } from 'node:path';
import { FileUuid, SimpleDriveFile } from '@/apps/main/database/entities/DriveFile';
import { FolderUuid, SimpleDriveFolder } from '@/apps/main/database/entities/DriveFolder';
import { ipcRendererDriveServerWip } from '@/infra/drive-server-wip/out/ipc-renderer';
import { ProcessSyncContext } from '@/apps/sync-engine/config';
import { updateFolderStatus } from '../../../placeholders/update-folder-status';
import { updateFileStatus } from '../../../placeholders/update-file-status';
import { NodeWin } from '@/infra/node-win/node-win.module';

type TProps = {
  ctx: ProcessSyncContext;
  path: RelativePath;
  absolutePath: AbsolutePath;
  itemName: string;
  item: SimpleDriveFile | SimpleDriveFolder;
} & ({ type: 'file'; uuid: FileUuid } | { type: 'folder'; uuid: FolderUuid });

export async function moveItem({ ctx, path, absolutePath, itemName, uuid, item, type }: TProps) {
  const parentPath = pathUtils.dirname(path);
  const name = basename(path);

  const { data: parentUuid, error } = NodeWin.getFolderUuid({ ctx, path: parentPath });

  if (error) throw error;

  // Neither move nor renamed
  if (item.parentUuid === parentUuid && itemName === name) return;

  const workspaceToken = ctx.workspaceToken;

  if (type === 'file') {
    await ipcRendererDriveServerWip.invoke('moveFileByUuid', { uuid, parentUuid, nameWithExtension: name, workspaceToken });
    updateFileStatus({ ctx, path });
  } else {
    await ipcRendererDriveServerWip.invoke('moveFolderByUuid', { uuid, parentUuid, name, workspaceToken });
    await updateFolderStatus({ ctx, path, absolutePath });
  }
}
