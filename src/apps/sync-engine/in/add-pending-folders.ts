import { Watcher } from '@/node-win/watcher/watcher';
import { PendingPaths } from './get-placeholders-with-pending-state';
import { onAddDir } from '@/node-win/watcher/events/on-add-dir.service';

type TProps = {
  watcher: Watcher;
  pendingFolders: PendingPaths[];
};

export async function addPendingFolders({ watcher, pendingFolders }: TProps) {
  await Promise.all(
    pendingFolders.map(async (pendingPath) => {
      await onAddDir({
        self: watcher,
        absolutePath: pendingPath.absolutePath,
        stats: pendingPath.stats,
      });
    }),
  );
}
