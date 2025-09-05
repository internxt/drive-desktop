import { QueueManager } from '@/node-win/queue/queue-manager';
import { TWatcherCallbacks, Watcher } from '@/node-win/watcher/watcher';
import { ProcessSyncContext } from './config';
import { logger } from '../shared/logger/logger';

type TProps = {
  ctx: ProcessSyncContext;
  watcherCallbacks: TWatcherCallbacks;
};

export function createWatcher({ ctx, watcherCallbacks }: TProps) {
  const queueManager = new QueueManager(ctx.virtualDrive, ctx.queueManagerPath);

  const watcher = new Watcher(
    ctx.virtualDrive.syncRootPath,
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
    ctx.virtualDrive,
    watcherCallbacks,
  );

  return { queueManager, watcher };
}
