import { BackupsContext } from '@/apps/backups/BackupInfo';
import { FilesDiff } from '@/apps/backups/diff/calculate-files-diff';
import { Sync } from '@/backend/features/sync';
import { scheduleRequest } from '../schedule-request';

type Props = {
  ctx: BackupsContext;
  modified: FilesDiff['modified'];
};

export async function replaceFiles({ ctx, modified }: Props) {
  await Promise.all(
    modified.map(async ({ local, remote }) => {
      const path = local.path;

      try {
        await scheduleRequest({ ctx, path, fn: () => Sync.Actions.replaceFile({ ctx, path, uuid: remote.uuid }) });
      } catch (error) {
        ctx.logger.error({ msg: 'Error replacing file', path, error });
      }
    }),
  );
}
