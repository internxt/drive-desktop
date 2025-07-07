import { QueueHandler, QueueManager } from '@/node-win/queue/queue-manager';
import { TWatcherCallbacks, Watcher } from '@/node-win/watcher/watcher';
import { getConfig } from './config';
import { logger } from '../shared/logger/logger';
import VirtualDrive from '@/node-win/virtual-drive';

type TProps = {
  queueCallbacks: QueueHandler;
  watcherCallbacks: TWatcherCallbacks;
  virtulDrive: VirtualDrive;
};

export function createWatcher({ queueCallbacks, watcherCallbacks, virtulDrive }: TProps) {
  const queueManager = new QueueManager({
    handlers: queueCallbacks,
    persistPath: getConfig().queueManagerPath,
  });

  const watcher = new Watcher(
    virtulDrive.syncRootPath,
    {
      depth: undefined,
      followSymlinks: true,
      ignored: /(^|[/\\])\../,
      ignoreInitial: true,
      persistent: true,
      usePolling: true,
      awaitWriteFinish: {
        stabilityThreshold: 2000,
        pollInterval: 100,
      },
    },
    queueManager,
    logger,
    virtulDrive,
    watcherCallbacks,
  );

  return { queueManager, watcher };
}
