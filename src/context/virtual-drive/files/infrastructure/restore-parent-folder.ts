import { NodeWin } from '@/infra/node-win/node-win.module';
import { PlatformPathConverter } from '../../shared/application/PlatformPathConverter';
import path from 'path';
import { getConfig } from '@/apps/sync-engine/config';
import VirtualDrive from '@/node-win/virtual-drive';
import { HttpRemoteFileSystem } from './HttpRemoteFileSystem';
import { driveServerWip } from '@/infra/drive-server-wip/drive-server-wip.module';
import { logger } from '@internxt/drive-desktop-core/build/backend';
import { HttpRemoteFolderSystem } from '../../folders/infrastructure/HttpRemoteFolderSystem';

type TProps = {
  offline: { contentsId: string; path: string; size: number; folderUuid: string };
  bucket: string;
  workspaceId?: string;
  drive: VirtualDrive;
};

export async function restoreParentFolder({ offline, drive, bucket, workspaceId }: TProps) {
  const posixDir = PlatformPathConverter.getFatherPathPosix(offline.path);
  const targetFolderName = path.posix.basename(posixDir);
  const grandParentFolder = PlatformPathConverter.getFatherPathPosix(posixDir);

  const { data: parentUuid } = NodeWin.getFolderUuid({
    drive,
    path: grandParentFolder,
  });

  if (!parentUuid) {
    throw logger.error({ msg: 'Could not restore parent folder, parentUuid not found', grandParentFolder });
  }

  const existentFolder = await HttpRemoteFolderSystem.existFolder({
    parentUuid,
    plainName: targetFolderName,
    path: grandParentFolder,
  });
  const remoteParentFolder = existentFolder || null;

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
      throw logger.error({ msg: 'Error restoring parent folder', moveError, renameError });
    }
  }

  const { data, error } = await HttpRemoteFileSystem.create({
    ...offline,
    bucket,
    workspaceId,
  });
  if (error) throw error;
  return data;
}
