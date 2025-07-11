import { AbsolutePath, pathUtils } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { basename } from 'path';
import { ipcRendererSqlite } from '@/infra/sqlite/ipc/ipc-renderer';
import { logger } from '@/apps/shared/logger/logger';
import VirtualDrive from '@/node-win/virtual-drive';
import { isMoveDirEvent } from './is-move-event';
import { getParentUuid } from './get-parent-uuid';
import { ipcRendererDriveServerWip } from '@/infra/drive-server-wip/out/ipc-renderer';
import { getConfig } from '@/apps/sync-engine/config';

type TProps = {
  virtualDrive: VirtualDrive;
  absolutePath: AbsolutePath;
};

export async function unlinkFolder({ virtualDrive, absolutePath }: TProps) {
  const path = pathUtils.absoluteToRelative({
    base: virtualDrive.syncRootPath,
    path: absolutePath,
  });

  try {
    const parentUuid = getParentUuid({ path, virtualDrive });
    if (!parentUuid) return;

    const name = basename(path);
    const { data: folder } = await ipcRendererSqlite.invoke('folderGetByName', { parentUuid, name });

    if (!folder) {
      logger.warn({ tag: 'SYNC-ENGINE', msg: 'Folder not found or does not exist', path, parentUuid, name });
      return;
    }

    const isMove = await isMoveDirEvent({ uuid: folder.uuid });
    if (isMove) return;

    logger.debug({ tag: 'SYNC-ENGINE', msg: 'Folder unlinked', path });

    const { error } = await ipcRendererDriveServerWip.invoke('storageDeleteFolderByUuid', {
      uuid: folder.uuid,
      workspaceToken: getConfig().workspaceToken,
    });

    if (error) throw error;
  } catch (exc) {
    logger.error({ tag: 'SYNC-ENGINE', msg: 'Error on unlink folder', path, exc });
  }
}
