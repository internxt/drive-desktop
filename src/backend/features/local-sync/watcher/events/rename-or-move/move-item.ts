import { pathUtils } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { basename } from 'node:path';
import { FileUuid, SimpleDriveFile } from '@/apps/main/database/entities/DriveFile';
import { FolderUuid, SimpleDriveFolder } from '@/apps/main/database/entities/DriveFolder';
import { ipcRendererDriveServerWip } from '@/infra/drive-server-wip/out/ipc-renderer';
import { ProcessSyncContext } from '@/apps/sync-engine/config';
import { NodeWin } from '@/infra/node-win/node-win.module';
import { AbsolutePath } from '@internxt/drive-desktop-core/build/backend';

type TProps = {
  ctx: ProcessSyncContext;
  path: AbsolutePath;
  itemName: string;
  item: SimpleDriveFile | SimpleDriveFolder;
} & ({ type: 'file'; uuid: FileUuid } | { type: 'folder'; uuid: FolderUuid });

export async function moveItem({ ctx, path, itemName, uuid, item, type }: TProps) {
  const parentPath = pathUtils.dirname(path);
  const name = basename(path);

  const { data: parentInfo, error } = NodeWin.getFolderInfo({ ctx, path: parentPath });

  if (error) throw error;

  const { uuid: parentUuid } = parentInfo;

  // Neither move nor renamed
  if (item.parentUuid === parentUuid && itemName === name) return;

  const workspaceToken = ctx.workspaceToken;

  if (type === 'file') {
    await ipcRendererDriveServerWip.invoke('moveFileByUuid', { uuid, parentUuid, path, workspaceToken });
  } else {
    await ipcRendererDriveServerWip.invoke('moveFolderByUuid', { uuid, parentUuid, path, workspaceToken });
  }

  ctx.virtualDrive.updateSyncStatus({ path });
}
