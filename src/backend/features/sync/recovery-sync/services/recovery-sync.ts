import { SyncContext } from '@/apps/sync-engine/config';
import { filesRecoverySync } from './files-recovery-sync';
import { sleep } from '@/apps/main/util';
import { FETCH_LIMIT_1000 } from '@/apps/main/remote-sync/store';

type Props = {
  ctx: SyncContext;
};

export async function recoverySync({ ctx }: Props) {
  let moreFiles = true;
  let filesOffset = 0;

  while (moreFiles) {
    if (ctx.abortController.signal.aborted) {
      ctx.logger.debug({ msg: 'Aborted recovery sync' });
      break;
    }

    try {
      const fileDtos = await filesRecoverySync({ ctx, offset: filesOffset });

      moreFiles = fileDtos.length === FETCH_LIMIT_1000;
      filesOffset += FETCH_LIMIT_1000;

      await sleep(60 * 1000);
    } catch (error) {
      ctx.logger.error({ msg: 'Error in recovery sync', error });
      break;
    }
  }
}
