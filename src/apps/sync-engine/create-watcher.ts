import { Watcher } from '@/node-win/watcher/watcher';

export function createWatcher() {
  const watcher = new Watcher({
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
