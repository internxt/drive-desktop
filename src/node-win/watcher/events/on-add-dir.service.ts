import { Watcher } from '../watcher';
import { AbsolutePath, pathUtils } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { NodeWin } from '@/infra/node-win/node-win.module';
import { moveFolder } from '@/backend/features/local-sync/watcher/events/rename-or-move/move-folder';
import { trackAddDirEvent } from '@/backend/features/local-sync/watcher/events/unlink/is-move-event';

type TProps = {
  self: Watcher;
  absolutePath: AbsolutePath;
};

export async function onAddDir({ self, absolutePath }: TProps) {
  const path = pathUtils.absoluteToRelative({
    base: self.virtualDrive.syncRootPath,
    path: absolutePath,
  });

  try {
    const { data: uuid } = NodeWin.getFolderUuid({
      drive: self.virtualDrive,
      path,
    });

    if (!uuid) {
      await self.callbacks.addController.createFolder({ path, absolutePath });
      return;
    }

    void trackAddDirEvent({ uuid });
    await moveFolder({ self, path, absolutePath, uuid });
  } catch (error) {
    self.logger.error({ msg: 'Error on event "addDir"', error });
  }
}
