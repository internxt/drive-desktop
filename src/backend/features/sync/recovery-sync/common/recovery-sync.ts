import { SyncContext } from '@/apps/sync-engine/config';
import { sleep } from '@/apps/main/util';
import { FETCH_LIMIT_1000 } from '@/apps/main/remote-sync/store';
import { filesRecoverySync } from '../files/files-recovery-sync';
import { foldersRecoverySync } from '../folders/folders-recovery-sync';

async function iterateRecoverySync(ctx: SyncContext, fn: typeof filesRecoverySync | typeof foldersRecoverySync) {
  let moreItems = true;
  let offset = 0;

  while (moreItems) {
    if (ctx.abortController.signal.aborted) {
      ctx.logger.debug({ msg: 'Aborted recovery sync' });
      break;
    }

    try {
      const fileDtos = await fn({ ctx, offset });

      moreItems = fileDtos.length === FETCH_LIMIT_1000;
      offset += FETCH_LIMIT_1000;

      await sleep(30 * 1000);
    } catch (error) {
      ctx.logger.error({ msg: 'Error in recovery sync', error });
      break;
    }
  }
}

export async function recoverySync({ ctx }: { ctx: SyncContext }) {
  await Promise.all([iterateRecoverySync(ctx, filesRecoverySync), iterateRecoverySync(ctx, foldersRecoverySync)]);
}
