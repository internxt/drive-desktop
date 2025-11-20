import { Watcher } from '@/node-win/watcher/watcher';
import { ProcessSyncContext } from './config';

type TProps = {
  ctx: ProcessSyncContext;
};

export function createWatcher({ ctx }: TProps) {
  const watcher = new Watcher(ctx.rootPath, {
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
  });

  return { watcher };
}
