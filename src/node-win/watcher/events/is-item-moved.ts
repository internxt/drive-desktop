import { RelativePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { PlatformPathConverter } from '@/context/virtual-drive/shared/application/PlatformPathConverter';
import { NodeWin } from '@/infra/node-win/node-win.module';
import { Watcher } from '../watcher';
import { getConfig } from '@/apps/sync-engine/config';
import { basename } from 'path';

type TProps = {
  self: Watcher;
  path: RelativePath;
  uuid: string;
  oldName?: string;
  oldParentUuid?: string;
  type: 'file' | 'folder';
};

export async function isItemMoved({ self, path, uuid, oldName, oldParentUuid, type }: TProps) {
  const posixDir = PlatformPathConverter.getFatherPathPosix(path);
  const { data: newParentUuid, error } = NodeWin.getFolderUuid({
    drive: self.virtualDrive,
    rootUuid: getConfig().rootUuid,
    path: posixDir,
  });

  /**
   * v2.5.6 Daniel Jiménez
   * This should never happen. If a file is moved (add event and has a placeholderId),
   * then the parent should has a placeholderId and the file should be in the database.
   * TODO: technically the last thing can happen for now, we have to add the file to the database
   * once added/moved, instead of waiting for the sync.
   */
  if (!oldName || !oldParentUuid || error) {
    self.logger.error({
      msg: 'oldName, oldParentUuid or newParentUuid is undefined',
      path,
      type,
      uuid,
      oldName,
      oldParentUuid,
      error,
    });
    return;
  }

  const newName = basename(path);
  const isRenamed = oldName !== newName;
  const isMoved = oldParentUuid !== newParentUuid;

  if (isRenamed && isMoved) {
    self.logger.warn({
      msg: 'Item moved and renamed. Action not permitted',
      path,
      type,
      uuid,
      oldName,
      newName,
      oldParentUuid,
      newParentUuid,
    });
  } else {
    const action = isRenamed ? 'rename' : 'move';

    self.logger.debug({
      msg: 'Item moved or renamed',
      path,
      action,
      oldName,
      newName,
      type,
      uuid,
    });

    await self.controllers?.renameOrMoveController.execute({
      path,
      uuid,
      type,
      action,
    });
  }
}
