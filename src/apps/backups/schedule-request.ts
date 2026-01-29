import { isBottleneckStop } from '@/infra/drive-server-wip/in/helpers/error-helpers';
import { tracker } from '../main/background-processes/backups/BackupsProcessTracker/BackupsProcessTracker';
import { BackupsContext } from './BackupInfo';

type Props = {
  ctx: BackupsContext;
  fn: () => Promise<unknown>;
};

export async function scheduleRequest({ ctx, fn }: Props) {
  try {
    await ctx.backupsBottleneck.schedule(() => fn());
    tracker.currentProcessed();
  } catch (error) {
    if (isBottleneckStop({ error })) return;

    throw error;
  }
}
