import { NodeWin } from '@/infra/node-win/node-win.module';
import { PlatformPathConverter } from '../../shared/application/PlatformPathConverter';
import path from 'path';
import { getConfig } from '@/apps/sync-engine/config';
import VirtualDrive from '@/node-win/virtual-drive';
import { HttpRemoteFileSystem } from './HttpRemoteFileSystem';
import { driveServerWip } from '@/infra/drive-server-wip/drive-server-wip.module';
import { logger } from '@internxt/drive-desktop-core/build/backend';

type TProps = {
  offline: { contentsId: string; path: string; drive: VirtualDrive; size: number; folderUuid: string };
  bucket: string;
  workspaceId?: string;
};

export async function restoreParentFolder({ offline, bucket, workspaceId }: TProps) {
  const posixDir = PlatformPathConverter.getFatherPathPosix(offline.path);
  const targetFolderName = path.posix.basename(posixDir);
  const grandParentFolder = PlatformPathConverter.getFatherPathPosix(posixDir);

  const { data: parentUuid } = NodeWin.getFolderUuid({
    drive: offline.drive,
    path: grandParentFolder,
  });

  if (!parentUuid) {
    throw logger.error({ msg: 'Local parentUuid not found' });
  }

  const { data: existsData } = await driveServerWip.folders.existsFolder({
    parentUuid,
    basename: targetFolderName,
  });
  const remoteParentFolder = existsData?.existentFolders?.[0] || null;

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
