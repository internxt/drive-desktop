import { onAdd } from '@/node-win/watcher/events/on-add.service';
import { Watcher } from '@/node-win/watcher/watcher';
import { PendingPaths } from './get-placeholders-with-pending-state';

type TProps = {
  watcher: Watcher;
  pendingFiles: PendingPaths[];
};

export async function addPendingFiles({ watcher, pendingFiles }: TProps) {
  await Promise.all(
    pendingFiles.map(async (pendingPath) => {
      await onAdd({
        self: watcher,
        absolutePath: pendingPath.absolutePath,
        stats: pendingPath.stats,
      });
    }),
  );
}
