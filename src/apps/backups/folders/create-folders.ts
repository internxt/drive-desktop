import { BackupsProcessTracker } from '@/apps/main/background-processes/backups/BackupsProcessTracker/BackupsProcessTracker';
import { BackupsContext } from '../BackupInfo';
import { LocalFolder } from '@/context/local/localFolder/domain/LocalFolder';
import { RemoteTree } from '../remote-tree/traverser';
import { pathUtils } from '@/context/local/localFile/infrastructure/AbsolutePath';
import type { Backup } from '../Backups';
import { Sync } from '@/backend/features/sync';

type TProps = {
  self: Backup;
  ctx: BackupsContext;
  tracker: BackupsProcessTracker;
  added: Array<LocalFolder>;
  tree: RemoteTree;
};

export async function createFolders({ self, ctx, added, tree, tracker }: TProps) {
  const sortedAdded = added.toSorted((a, b) => a.absolutePath.localeCompare(b.absolutePath));

  for (const local of sortedAdded) {
    if (ctx.abortController.signal.aborted) return;

    const path = local.absolutePath;

    try {
      const parentPath = pathUtils.dirname(local.absolutePath);
      const parent = tree.folders.get(parentPath);

      if (!parent) continue;

      const folder = await Sync.Actions.createFolder({ ctx, path, parentUuid: parent.uuid });

      if (!folder) continue;

      tree.folders.set(local.absolutePath, { ...folder, absolutePath: local.absolutePath });
    } catch (error) {
      ctx.logger.error({ msg: 'Error creating folder', path, error });
    } finally {
      self.backed++;
      tracker.currentProcessed(self.backed);
    }
  }
}
