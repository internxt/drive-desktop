import { AbsolutePath } from '@internxt/drive-desktop-core/build/backend';
import { isBottleneckStop } from '@/infra/drive-server-wip/in/helpers/error-helpers';
import { tracker } from '../main/background-processes/backups/BackupsProcessTracker/BackupsProcessTracker';
import { BackupsContext } from './BackupInfo';

type Props = {
  ctx: BackupsContext;
  path: AbsolutePath;
  fn: () => Promise<unknown>;
  willRetry?: () => boolean;
};

export async function scheduleRequest({ ctx, path, fn, willRetry }: Props) {
  try {
    await ctx.backupsBottleneck.schedule(() => fn());
  } catch (error) {
    if (isBottleneckStop({ error })) return;

    throw error;
  } finally {
    if (!willRetry?.()) tracker.currentProcessed(path);
  }
}
