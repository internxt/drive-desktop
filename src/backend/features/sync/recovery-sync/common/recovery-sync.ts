import { Result } from '@internxt/drive-desktop-core/build/common/result';
import { FETCH_LIMIT_1000 } from '@/apps/main/remote-sync/store';
import { sleep } from '@/apps/main/util';
import { SyncContext } from '@/apps/sync-engine/config';
import { filesRecoverySync } from '../files/files-recovery-sync';
import { foldersRecoverySync } from '../folders/folders-recovery-sync';

async function iterateRecoverySync(
  ctx: SyncContext,
  fn: typeof filesRecoverySync | typeof foldersRecoverySync,
): Promise<Result<boolean, Error>> {
  let moreItems = true;
  let offset = 0;

  while (moreItems) {
    if (ctx.abortController.signal.aborted) {
      ctx.logger.debug({ msg: 'Aborted recovery sync' });
      return Result.err(new Error('Recovery sync was aborted'));
    }

    try {
      const fileDtos = await fn({ ctx, offset });

      moreItems = fileDtos.length === FETCH_LIMIT_1000;
      offset += FETCH_LIMIT_1000;

      await sleep(30 * 1000);
    } catch (error) {
      ctx.logger.error({ msg: 'Error in recovery sync', error });
      return Result.err(error instanceof Error ? error : new Error(String(error)));
    }
  }

  return Result.ok(true);
}

export async function recoverySync({ ctx }: { ctx: SyncContext }): Promise<Result<boolean, Error>> {
  const results = await Promise.all([iterateRecoverySync(ctx, filesRecoverySync), iterateRecoverySync(ctx, foldersRecoverySync)]);
  const error = results.find((result) => result.error)?.error;
  return error ? Result.err(error) : Result.ok(true);
}
