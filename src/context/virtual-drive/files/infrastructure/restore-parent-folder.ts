import { NodeWin } from '@/infra/node-win/node-win.module';
import path from 'path';
import { getConfig } from '@/apps/sync-engine/config';
import VirtualDrive from '@/node-win/virtual-drive';
import { driveServerWip } from '@/infra/drive-server-wip/drive-server-wip.module';
import { logger } from '@internxt/drive-desktop-core/build/backend';
import { HttpRemoteFolderSystem } from '../../folders/infrastructure/HttpRemoteFolderSystem';
import { pathUtils, RelativePath } from '@/context/local/localFile/infrastructure/AbsolutePath';

type TProps = {
  offline: { contentsId: string; path: RelativePath; size: number; folderUuid: string };
  drive: VirtualDrive;
};

export async function restoreParentFolder({ offline, drive }: TProps) {
  const posixDir = pathUtils.dirname(offline.path);
  const targetFolderName = path.posix.basename(posixDir);
  const grandParentFolder = pathUtils.dirname(posixDir);

  const { data: parentUuid } = NodeWin.getFolderUuid({
    drive,
    path: grandParentFolder,
  });

  if (!parentUuid) {
    throw logger.error({ msg: 'Could not restore parent folder, parentUuid not found', posixDir });
  }

  const remoteParentFolder = await HttpRemoteFolderSystem.existFolder({
    parentUuid,
    plainName: targetFolderName,
    path: grandParentFolder,
  });

  if (!remoteParentFolder) {
    const config = getConfig();
    const [{ error: moveError }, { error: renameError }] = await Promise.all([
      driveServerWip.folders.moveFolder({
        parentUuid,
        workspaceToken: config.workspaceToken,
        uuid: offline.folderUuid,
      }),
      driveServerWip.folders.renameFolder({
        name: targetFolderName,
        workspaceToken: config.workspaceToken,
        uuid: offline.folderUuid,
      }),
    ]);

    if (moveError || renameError) {
      throw logger.error({ msg: 'Error restoring parent folder', moveError, renameError, posixDir });
    }
  }
}
