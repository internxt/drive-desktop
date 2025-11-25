import { AbsolutePath, pathUtils } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { basename } from 'node:path';
import { ipcRendererSqlite } from '@/infra/sqlite/ipc/ipc-renderer';
import { logger } from '@/apps/shared/logger/logger';
import { getParentUuid } from './get-parent-uuid';
import { ipcRendererDriveServerWip } from '@/infra/drive-server-wip/out/ipc-renderer';
import { ProcessSyncContext } from '@/apps/sync-engine/config';
import { isMoveFolderEvent } from './is-move-event';

type TProps = {
  ctx: ProcessSyncContext;
  path: AbsolutePath;
};

export async function unlinkFolder({ ctx, path }: TProps) {
  try {
    const parentUuid = await getParentUuid({ path, ctx });
    if (!parentUuid) return;

    const plainName = basename(path);
    const { data: folder } = await ipcRendererSqlite.invoke('folderGetByName', { parentUuid, plainName });

    if (!folder) {
      logger.warn({ tag: 'SYNC-ENGINE', msg: 'Cannot unlink folder, not found or does not exist', path, parentUuid, plainName });
      return;
    }

    const isMove = await isMoveFolderEvent({ uuid: folder.uuid });
    if (isMove) {
      logger.debug({ tag: 'SYNC-ENGINE', msg: 'Is move event', path });
      return;
    }

    logger.debug({ tag: 'SYNC-ENGINE', msg: 'Folder unlinked', path });

    const { error } = await ipcRendererDriveServerWip.invoke('storageDeleteFolderByUuid', {
      uuid: folder.uuid,
      workspaceToken: ctx.workspaceToken,
      path,
    });

    if (error) throw error;
  } catch (exc) {
    logger.error({ tag: 'SYNC-ENGINE', msg: 'Error on unlink folder', path, exc });
  }
}
