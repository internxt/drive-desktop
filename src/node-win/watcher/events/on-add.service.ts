import { Stats } from 'fs';

import { Watcher } from '../watcher';
import { PinState, SyncState } from '@/node-win/types/placeholder.type';
import { typeQueue } from '@/node-win/queue/queueManager';

export class OnAddService {
  execute({ self, path, stats }: { self: Watcher; path: string; stats: Stats }) {
    try {
      const { size, birthtime, mtime } = stats;

      if (size === 0 || size > 20 * 1024 * 1024 * 1024) return;

      const itemId = self.addon.getFileIdentity({ path });
      const status = self.addon.getPlaceholderState({ path });

      const creationTime = new Date(birthtime).getTime();
      const modificationTime = new Date(mtime).getTime();

      let isNewFile = false;
      let isMovedFile = false;

      if (!itemId) {
        isNewFile = true;
      } else if (creationTime !== modificationTime) {
        isMovedFile = true;
      }

      if (status.pinState === PinState.AlwaysLocal || status.pinState === PinState.OnlineOnly || status.syncState === SyncState.InSync) {
        return;
      }

      if (isNewFile) {
        self.fileInDevice.add(path);
        self.queueManager.enqueue({ path, type: typeQueue.add, isFolder: false });
      } else if (isMovedFile) {
        self.logger.debug({ msg: 'File moved', path });
      }
    } catch (error) {
      self.logger.error({ msg: 'onAddService', error });
    }
  }
}
