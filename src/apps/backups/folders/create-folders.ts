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

    await createFolder({ ctx, local, tree });
    self.backed++;
    tracker.currentProcessed(self.backed);
  }
}

async function createFolder({ ctx, local, tree }: { ctx: BackupsContext; local: LocalFolder; tree: RemoteTree }) {
  const path = local.absolutePath;

  const parentPath = pathUtils.dirname(local.absolutePath);
  const parent = tree.folders.get(parentPath);

  if (!parent) return;

  const folder = await Sync.Actions.createFolder({ ctx, path, parentUuid: parent.uuid });

  if (!folder) return;

  tree.folders.set(path, { ...folder, absolutePath: path });
}
