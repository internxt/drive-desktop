import { BackupsProcessTracker } from '@/apps/main/background-processes/backups/BackupsProcessTracker/BackupsProcessTracker';
import { BackupsContext } from '../BackupInfo';
import { RemoteTree } from '../remote-tree/traverser';
import { pathUtils } from '@/context/local/localFile/infrastructure/AbsolutePath';
import type { Backup } from '../Backups';
import { Sync } from '@/backend/features/sync';
import { AbsolutePath } from '@internxt/drive-desktop-core/build/backend';

type TProps = {
  self: Backup;
  ctx: BackupsContext;
  tracker: BackupsProcessTracker;
  added: Array<AbsolutePath>;
  tree: RemoteTree;
};

export async function createFolders({ self, ctx, added, tree, tracker }: TProps) {
  const sortedAdded = added.toSorted((a, b) => a.localeCompare(b));

  for (const path of sortedAdded) {
    if (ctx.abortController.signal.aborted) return;

    await createFolder({ ctx, path, tree });
    self.backed++;
    tracker.currentProcessed(self.backed);
  }
}

async function createFolder({ ctx, path, tree }: { ctx: BackupsContext; path: AbsolutePath; tree: RemoteTree }) {
  try {
    const parentPath = pathUtils.dirname(path);
    const parent = tree.folders.get(parentPath);

    if (!parent) return;

    const folder = await Sync.Actions.createFolder({ ctx, path, parentUuid: parent.uuid });

    if (!folder) return;

    tree.folders.set(path, { ...folder, absolutePath: path });
  } catch (error) {
    ctx.logger.error({ msg: 'Error creating folder', path, error });
  }
}
