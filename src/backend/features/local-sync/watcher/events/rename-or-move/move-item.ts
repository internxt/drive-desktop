import { pathUtils } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { basename } from 'node:path';
import { FileUuid, SimpleDriveFile } from '@/apps/main/database/entities/DriveFile';
import { FolderUuid, SimpleDriveFolder } from '@/apps/main/database/entities/DriveFolder';
import { ProcessSyncContext } from '@/apps/sync-engine/config';
import { NodeWin } from '@/infra/node-win/node-win.module';
import { AbsolutePath } from '@internxt/drive-desktop-core/build/backend';
import { Addon } from '@/node-win/addon-wrapper';
import { persistMoveFile, persistMoveFolder } from '@/infra/drive-server-wip/out/ipc-main';

type TProps = {
  ctx: ProcessSyncContext;
  path: AbsolutePath;
  item: SimpleDriveFile | SimpleDriveFolder;
} & ({ type: 'file'; uuid: FileUuid } | { type: 'folder'; uuid: FolderUuid });

export async function moveItem({ ctx, path, uuid, item, type }: TProps) {
  const parentPath = pathUtils.dirname(path);
  const name = basename(path);

  const { data: parentInfo } = await NodeWin.getFolderInfo({ ctx, path: parentPath });

  if (!parentInfo) return;

  const { uuid: parentUuid } = parentInfo;

  let action: 'move' | 'rename' | undefined;
  if (item.parentUuid !== parentUuid) action = 'move';
  else if (item.name !== name) action = 'rename';

  if (!action) return;

  if (type === 'file') {
    await persistMoveFile({ ctx, uuid, parentUuid, path, action });
  } else {
    await persistMoveFolder({ ctx, uuid, parentUuid, path, action });
  }

  await Addon.updateSyncStatus({ path });
}
