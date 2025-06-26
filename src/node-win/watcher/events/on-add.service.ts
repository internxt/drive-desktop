import { Stats } from 'fs';

import { Watcher } from '../watcher';
import { typeQueue } from '@/node-win/queue/queueManager';
import { BucketEntry } from '@/context/virtual-drive/shared/domain/BucketEntry';
import { logger } from '@/apps/shared/logger/logger';

type TProps = {
  self: Watcher;
  path: string;
  stats: Stats;
};

export function onAdd({ self, path, stats }: TProps) {
  try {
    const { size, birthtime, mtime } = stats;

    if (size === 0 || size > BucketEntry.MAX_SIZE) {
      logger.warn({ msg: 'Invalid file size', path, size });
      return;
    }

    const placeholderId = self.addon.getFileIdentity({ path });

    if (!placeholderId) {
      self.logger.debug({ msg: 'File added', path });
      self.fileInDevice.add(path);
      self.queueManager.enqueue({ path, type: typeQueue.add, isFolder: false });
      return;
    }

    const creationTime = new Date(birthtime).getTime();
    const modificationTime = new Date(mtime).getTime();

    if (creationTime === modificationTime) {
      /* File added from remote */
    } else {
      self.logger.debug({ msg: 'File moved or renamed', path, placeholderId });
    }
  } catch (error) {
    self.logger.error({ msg: 'Error onAdd', path, error });
  }
}
