import { AbsolutePath, pathUtils } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { basename } from 'path';
import { ipcRendererSqlite } from '@/infra/sqlite/ipc/ipc-renderer';
import { logger } from '@/apps/shared/logger/logger';
import VirtualDrive from '@/node-win/virtual-drive';
import { getParentUuid } from './get-parent-uuid';
import { ipcRendererDriveServerWip } from '@/infra/drive-server-wip/out/ipc-renderer';
import { getConfig } from '@/apps/sync-engine/config';
import { isMoveFolderEvent } from './is-move-event';

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
    const parentUuid = await getParentUuid({ absolutePath, virtualDrive });
    if (!parentUuid) return;

    const plainName = basename(path);
    const { data: folder } = await ipcRendererSqlite.invoke('folderGetByName', { parentUuid, plainName });

    if (!folder) {
      logger.warn({ tag: 'SYNC-ENGINE', msg: 'Cannot unlink folder, not found or does not exist', path, parentUuid, plainName });
      return;
    }

    const isMove = await isMoveFolderEvent({ uuid: folder.uuid });
    if (isMove) return;

    logger.debug({ tag: 'SYNC-ENGINE', msg: 'Folder unlinked', path });

    const { error } = await ipcRendererDriveServerWip.invoke('storageDeleteFolderByUuid', {
      uuid: folder.uuid,
      workspaceToken: getConfig().workspaceToken,
      name: plainName,
    });

    if (error) throw error;
  } catch (exc) {
    logger.error({ tag: 'SYNC-ENGINE', msg: 'Error on unlink folder', path, exc });
  }
}
