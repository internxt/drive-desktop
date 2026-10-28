import { Result } from '@internxt/drive-desktop-core/build/common/result';
import { SyncContext } from '@/apps/sync-engine/config';
import { scanRecoverySyncFiles } from './scan-recovery-sync-files';
import { scanRecoverySyncFolders } from './scan-recovery-sync-folders';

export async function scanRecoverySync({ ctx }: { ctx: SyncContext }): Promise<Result<void, Error>> {
  const results = await Promise.allSettled([scanRecoverySyncFiles({ ctx }), scanRecoverySyncFolders({ ctx })]);

  for (const result of results) {
    if (result.status === 'rejected') {
      const error =
        result.reason instanceof Error ? result.reason : new Error('Unexpected recovery sync scan error', { cause: result.reason });
      ctx.logger.error({ msg: 'Unexpected error in recovery sync scan', error });
      return Result.err(error);
    }

    if (result.value.error) return Result.err(result.value.error);
  }

  return Result.ok(undefined);
}
