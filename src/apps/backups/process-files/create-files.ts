import { BackupsContext } from '@/apps/backups/BackupInfo';
import { RemoteTree } from '@/apps/backups/remote-tree/traverser';
import { Backup } from '@/apps/backups/Backups';
import { BackupsProcessTracker } from '@/apps/main/background-processes/backups/BackupsProcessTracker/BackupsProcessTracker';
import { dirname } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { Sync } from '@/backend/features/sync';
import { SyncWalkItem } from '@/infra/file-system/services/sync-walk';

type Props = {
  self: Backup;
  ctx: BackupsContext;
  tracker: BackupsProcessTracker;
  remoteTree: RemoteTree;
  added: SyncWalkItem[];
};

export async function createFiles({ self, ctx, tracker, remoteTree, added }: Props) {
  await Promise.all(
    added.map(async (local) => {
      const path = local.path;
      const parentPath = dirname(path);
      const parent = remoteTree.folders.get(parentPath);

      if (!parent) return;

      try {
        await Sync.Actions.createFile({ ctx, path, stats: local.stats, parentUuid: parent.uuid });
      } catch (error) {
        ctx.logger.error({ msg: 'Error creating file', path, error });
      }

      self.backed++;
      tracker.currentProcessed(self.backed);
    }),
  );
}
