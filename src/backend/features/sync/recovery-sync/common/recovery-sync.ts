import { Result } from '@internxt/drive-desktop-core/build/common/result';
import { FETCH_LIMIT_1000 } from '@/apps/main/remote-sync/store';
import { sleep } from '@/apps/main/util';
import { SyncContext } from '@/apps/sync-engine/config';
import { filesRecoverySync } from '../files/files-recovery-sync';
import { foldersRecoverySync } from '../folders/folders-recovery-sync';
import { createRecoverySyncAbortError } from './create-recovery-sync-abort-error';

function getRecoverySyncError({ cause, signal }: { cause: unknown; signal: AbortSignal }): Error {
  if (signal.aborted) return createRecoverySyncAbortError();
  return cause instanceof Error ? cause : new Error(String(cause));
}

async function iterateRecoverySync(
  ctx: SyncContext,
  fn: typeof filesRecoverySync | typeof foldersRecoverySync,
): Promise<Result<boolean, Error>> {
  let moreItems = true;
  let offset = 0;
  const { signal } = ctx.abortController;

  while (moreItems && !signal.aborted) {
    try {
      const fileDtos = await fn({ ctx, offset });

      if (signal.aborted) break;

      moreItems = fileDtos.length === FETCH_LIMIT_1000;
      offset += FETCH_LIMIT_1000;

      await sleep(30 * 1000);
    } catch (error) {
      const failure = getRecoverySyncError({ cause: error, signal });
      if (failure.name !== 'AbortError') {
        ctx.logger.error({ msg: 'Error in recovery sync', error });
      }
      return Result.err(failure);
    }
  }

  if (signal.aborted) {
    ctx.logger.debug({ msg: 'Aborted recovery sync' });
    return Result.err(createRecoverySyncAbortError());
  }

  return Result.ok(true);
}

export async function recoverySync({ ctx }: { ctx: SyncContext }): Promise<Result<boolean, Error>> {
  const results = await Promise.all([iterateRecoverySync(ctx, filesRecoverySync), iterateRecoverySync(ctx, foldersRecoverySync)]);
  const error = results.find((result) => result.error)?.error;
  return error ? Result.err(error) : Result.ok(true);
}
