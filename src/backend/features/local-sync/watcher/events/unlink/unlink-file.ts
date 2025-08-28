import { AbsolutePath, pathUtils } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { basename } from 'path';
import { ipcRendererSqlite } from '@/infra/sqlite/ipc/ipc-renderer';
import { logger } from '@/apps/shared/logger/logger';
import VirtualDrive from '@/node-win/virtual-drive';
import { getParentUuid } from './get-parent-uuid';
import { ipcRendererDriveServerWip } from '@/infra/drive-server-wip/out/ipc-renderer';
import { getConfig } from '@/apps/sync-engine/config';
import { isMoveFileEvent } from './is-move-event';

type TProps = {
  virtualDrive: VirtualDrive;
  absolutePath: AbsolutePath;
};

export async function unlinkFile({ virtualDrive, absolutePath }: TProps) {
  const path = pathUtils.absoluteToRelative({
    base: virtualDrive.syncRootPath,
    path: absolutePath,
  });

  try {
    const parentUuid = await getParentUuid({ absolutePath, virtualDrive });
    if (!parentUuid) return;

    const nameWithExtension = basename(path);
    const { data: file } = await ipcRendererSqlite.invoke('fileGetByName', { parentUuid, nameWithExtension });

    /**
     * v2.5.6 Daniel Jiménez
     * TODO: since this event it's also triggered when we change or remove something
     * in remote and it automatically markes it as TRASHED in sqlite, this error is always logged.
     */
    if (!file) {
      logger.warn({ tag: 'SYNC-ENGINE', msg: 'Cannot unlink file, not found or does not exist', path, parentUuid, nameWithExtension });
      return;
    }

    const isMove = await isMoveFileEvent({ uuid: file.uuid });
    if (isMove) return;

    logger.debug({ tag: 'SYNC-ENGINE', msg: 'File unlinked', path });

    const { error } = await ipcRendererDriveServerWip.invoke('storageDeleteFileByUuid', {
      uuid: file.uuid,
      workspaceToken: getConfig().workspaceToken,
      nameWithExtension,
    });

    if (error) throw error;
  } catch (exc) {
    logger.error({ tag: 'SYNC-ENGINE', msg: 'Error on unlink file', path, exc });
  }
}
