import { BackupsContext } from '@/apps/backups/BackupInfo';
import { Backup } from '@/apps/backups/Backups';
import { BackupsProcessTracker } from '@/apps/main/background-processes/backups/BackupsProcessTracker/BackupsProcessTracker';
import { FilesDiff } from '@/apps/backups/diff/calculate-files-diff';
import { Sync } from '@/backend/features/sync';

type Props = {
  self: Backup;
  ctx: BackupsContext;
  tracker: BackupsProcessTracker;
  modified: FilesDiff['modified'];
};

export async function replaceFiles({ self, ctx, tracker, modified }: Props) {
  await Promise.all(
    modified.map(async ({ local, remote }) => {
      const path = local.path;

      try {
        await Sync.Actions.replaceFile({ ctx, uuid: remote.uuid, path, stats: local.stats });
      } catch (error) {
        ctx.logger.error({ msg: 'Error creating file', path, error });
      }

      self.backed++;
      tracker.currentProcessed(self.backed);
    }),
  );
}
