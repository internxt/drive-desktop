import { isBottleneckStop } from '@/infra/drive-server-wip/in/helpers/error-helpers';
import { tracker } from '../main/background-processes/backups/BackupsProcessTracker/BackupsProcessTracker';
import { BackupsContext } from './BackupInfo';
import { AbsolutePath } from '@internxt/drive-desktop-core/build/backend';

type Props = {
  ctx: BackupsContext;
  path: AbsolutePath;
  fn: () => Promise<unknown>;
};

export async function scheduleRequest({ ctx, path, fn }: Props) {
  try {
    await ctx.backupsBottleneck.schedule(() => fn());
  } catch (error) {
    if (isBottleneckStop({ error })) return;

    throw error;
  } finally {
    tracker.currentProcessed(path);
  }
}
