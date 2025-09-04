import { QueueManager } from '@/node-win/queue/queue-manager';
import { Watcher } from '@/node-win/watcher/watcher';
import { ProcessSyncContext } from './config';
import { logger } from '../shared/logger/logger';
import VirtualDrive from '@/node-win/virtual-drive';

type TProps = {
  ctx: ProcessSyncContext;
  virtualDrive: VirtualDrive;
};

export function createWatcher({ ctx, virtualDrive }: TProps) {
  const queueManager = new QueueManager(virtualDrive, ctx.queueManagerPath);

  const watcher = new Watcher(
    virtualDrive.syncRootPath,
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
    virtualDrive,
  );

  return { queueManager, watcher };
}
