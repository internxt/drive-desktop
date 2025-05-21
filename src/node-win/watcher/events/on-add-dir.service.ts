import { Stats } from 'fs';

import { Watcher } from '../watcher';
import { PinState, SyncState } from '@/node-win/types/placeholder.type';
import { typeQueue } from '@/node-win/queue/queueManager';

export class OnAddDirService {
  execute({ self, path }: TProps) {
    try {
      const status = self.addon.getPlaceholderState({ path });
      self.logger.debug({ msg: 'onAddDir', path, status });

      if (status.pinState === PinState.AlwaysLocal || status.pinState === PinState.OnlineOnly || status.syncState === SyncState.InSync) {
        return;
      }

      self.queueManager.enqueue({ path, type: typeQueue.add, isFolder: true });
    } catch (error) {
      self.logger.error({ msg: 'Error en onAddDir', error });
    }
  }
}

type TProps = {
  self: Watcher;
  path: string;
  stats: Stats;
};
