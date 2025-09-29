import { SyncContext } from '@/apps/sync-engine/config';
import { filesRecoverySync } from './files-recovery-sync';
import { sleep } from '@/apps/main/util';
import { logger } from '@internxt/drive-desktop-core/build/backend';

const FETCH_LIMIT = 1000;

type Props = {
  ctx: SyncContext;
};

export async function recoverySync({ ctx }: Props) {
  let moreFiles = true;
  let filesOffset = 0;

  while (moreFiles) {
    try {
      const fileDtos = await filesRecoverySync({ ctx, limit: FETCH_LIMIT, offset: filesOffset });

      moreFiles = fileDtos.length === FETCH_LIMIT;
      filesOffset += FETCH_LIMIT;
    } catch (exc) {
      logger.error({
        tag: 'SYNC-ENGINE',
        msg: 'Error in recovery sync',
        exc,
      });
    }

    await sleep(60 * 1000);
  }
}
