import { BackupsContext } from '@/apps/backups/BackupInfo';
import { RemoteTree } from '@/apps/backups/remote-tree/traverser';
import { Backup } from '@/apps/backups/Backups';
import { BackupsProcessTracker } from '@/apps/main/background-processes/backups/BackupsProcessTracker/BackupsProcessTracker';
import { dirname } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { Sync } from '@/backend/features/sync';
import { StatItem } from '@/infra/file-system/services/stat-readdir';

type Props = {
  self: Backup;
  ctx: BackupsContext;
  tracker: BackupsProcessTracker;
  remoteTree: RemoteTree;
  added: StatItem[];
};

export async function createFiles({ self, ctx, tracker, remoteTree, added }: Props) {
  await Promise.all(
    added.map(async (local) => {
      await createFile({ ctx, local, remoteTree });
      self.backed++;
      tracker.currentProcessed(self.backed);
    }),
  );
}

async function createFile({ ctx, local, remoteTree }: { ctx: BackupsContext; local: StatItem; remoteTree: RemoteTree }) {
  const path = local.path;

  try {
    const parentPath = dirname(path);
    const parent = remoteTree.folders.get(parentPath);

    if (!parent) return;

    await Sync.Actions.createFile({ ctx, path, parentUuid: parent.uuid });
  } catch (error) {
    ctx.logger.error({ msg: 'Error creating file', path, error });
  }
}
