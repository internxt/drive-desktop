import { onAdd } from '@/node-win/watcher/events/on-add.service';
import { Watcher } from '@/node-win/watcher/watcher';
import { PendingPaths } from './get-placeholders-with-pending-state';

type TProps = {
  watcher: Watcher;
  pendingPaths: PendingPaths[];
};

export async function addPendingFiles({ watcher, pendingPaths }: TProps) {
  await Promise.all(
    pendingPaths.map(async (pendingPath) => {
      await onAdd({
        self: watcher,
        absolutePath: pendingPath.absolutePath,
        stats: pendingPath.stats,
      });
    }),
  );
}
