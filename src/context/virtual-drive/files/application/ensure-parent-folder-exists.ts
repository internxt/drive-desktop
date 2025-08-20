import VirtualDrive from '@/node-win/virtual-drive';
import { HttpRemoteFileSystem } from '../infrastructure/HttpRemoteFileSystem';
import path from 'path';
import { PlatformPathConverter } from '../../shared/application/PlatformPathConverter';
import { NodeWin } from '@/infra/node-win/node-win.module';
import { getConfig } from '@/apps/sync-engine/config';

type EnsureParentFolderParams = {
  remote: HttpRemoteFileSystem;
  virtualDrive: VirtualDrive;
  posixDir: string;
};

export async function ensureParentFolderExists({ remote, virtualDrive, posixDir }: EnsureParentFolderParams) {
  const targetFolderName = path.posix.basename(posixDir);
  const grandParentFolder = PlatformPathConverter.getFatherPathPosix(posixDir);

  const { data: folderUuid } = NodeWin.getFolderUuid({
    drive: virtualDrive,
    path: posixDir,
  });
  const { data: parentUuid } = NodeWin.getFolderUuid({
    drive: virtualDrive,
    path: grandParentFolder,
  });

  if (!folderUuid || !parentUuid) return false;

  const remoteParentFolder = await remote.existParentFolder({
    plainName: targetFolderName,
    parentUuid,
    path: posixDir,
  });

  if (!remoteParentFolder) {
    const config = getConfig();
    await remote.restoreAndRenameParentFolder({
      uuid: folderUuid,
      parentUuid,
      name: targetFolderName,
      workspaceToken: config.workspaceToken,
    });
  }

  return true;
}
