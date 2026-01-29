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
        await Sync.Actions.replaceFile({ ctx, path, uuid: remote.uuid });
      } catch (error) {
        ctx.logger.error({ msg: 'Error replacing file', path, error });
      } finally {
        self.backed++;
        tracker.currentProcessed(self.backed);
      }
    }),
  );
}
