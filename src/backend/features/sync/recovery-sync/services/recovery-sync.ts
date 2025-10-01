import { SyncContext } from '@/apps/sync-engine/config';
import { filesRecoverySync } from './files-recovery-sync';
import { sleep } from '@/apps/main/util';

const FETCH_LIMIT = 1000;

type Props = {
  ctx: SyncContext;
};

export async function recoverySync({ ctx }: Props) {
  /**
   * v2.6.0 Daniel Jiménez
   * Workspaces limit 1000 is not implemented yet in drive-server-wip.
   */
  if (ctx.workspaceId) return;

  let moreFiles = true;
  let filesOffset = 0;

  while (moreFiles) {
    if (ctx.abortController.signal.aborted) {
      ctx.logger.debug({ msg: 'Aborted recovery sync' });
      break;
    }

    try {
      const fileDtos = await filesRecoverySync({ ctx, limit: FETCH_LIMIT, offset: filesOffset });

      moreFiles = fileDtos.length === FETCH_LIMIT;
      filesOffset += FETCH_LIMIT;

      await sleep(60 * 1000);
    } catch (error) {
      ctx.logger.error({ msg: 'Error in recovery sync', error });
      break;
    }
  }
}
