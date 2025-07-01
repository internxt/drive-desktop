import { Stats } from 'fs';

import { Watcher } from '../watcher';
import { typeQueue } from '@/node-win/queue/queueManager';
import { AbsolutePath, pathUtils } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { NodeWin } from '@/infra/node-win/node-win.module';
import { getConfig } from '@/apps/sync-engine/config';
import { isFolderMoved } from './is-folder-moved';

type TProps = {
  self: Watcher;
  absolutePath: AbsolutePath;
  stats: Stats;
};

export async function onAddDir({ self, absolutePath, stats }: TProps) {
  const path = pathUtils.absoluteToRelative({
    base: self.virtualDrive.syncRootPath as AbsolutePath,
    path: absolutePath,
  });

  try {
    const { birthtime, mtime } = stats;

    const { data: uuid } = NodeWin.getFolderUuid({
      drive: self.virtualDrive,
      path,
      rootUuid: getConfig().rootUuid,
    });

    if (!uuid) {
      self.logger.debug({ msg: 'Folder added', path });
      self.queueManager.enqueue({ path, type: typeQueue.add, isFolder: true });
      return;
    }

    const creationTime = new Date(birthtime).getTime();
    const modificationTime = new Date(mtime).getTime();

    if (creationTime === modificationTime) {
      /* Folder added from remote */
    } else {
      await isFolderMoved({ self, path, uuid });
    }
  } catch (error) {
    self.logger.error({ msg: 'Error en onAddDir', error });
  }
}
