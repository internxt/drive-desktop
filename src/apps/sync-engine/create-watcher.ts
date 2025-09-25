import { Watcher } from '@/node-win/watcher/watcher';
import { ProcessSyncContext } from './config';
import { logger } from '../shared/logger/logger';

type TProps = {
  ctx: ProcessSyncContext;
};

export function createWatcher({ ctx }: TProps) {
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
    logger,
  );

  return { watcher };
}
