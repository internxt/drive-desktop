import { Result } from '@internxt/drive-desktop-core/build/common/result';
import { changeSyncStatus } from '@/apps/main/remote-sync/RemoteSyncManager';
import { SyncContext } from '@/apps/sync-engine/config';
import { refreshItemPlaceholders } from '@/apps/sync-engine/refresh-item-placeholders';
import { createRecoverySyncAbortError } from '../common/create-recovery-sync-abort-error';
import { recoverySynclogger } from '../constants';

/**
 * v2.7.2 Alexis Mora
 * Runs the recovery of one context and refreshes its placeholders, so the previous recovery and the one that preserves files
 * share the same status handling.
 */
export async function recoverContext({
  ctx,
  recover,
}: {
  ctx: SyncContext;
  recover: () => Promise<Result<unknown, Error>>;
}): Promise<Result<boolean, Error>> {
  try {
    const result = await recover();
    // Logout owns worker cleanup and tray status; cancelled work must not broadcast a later status.
    if (ctx.abortController.signal.aborted) {
      return Result.err(createRecoverySyncAbortError());
    }

    if (result.error) {
      changeSyncStatus({ ctx, status: result.error.name === 'AbortError' ? 'IDLE' : 'SYNC_FAILED' });
      return Result.err(result.error);
    }

    const refreshResult = await refreshItemPlaceholders({ ctx, isFirstExecution: false });
    if (ctx.abortController.signal.aborted) {
      return Result.err(createRecoverySyncAbortError());
    }

    if (refreshResult.error) {
      changeSyncStatus({ ctx, status: refreshResult.error.name === 'AbortError' ? 'IDLE' : 'SYNC_FAILED' });
      return refreshResult;
    }

    changeSyncStatus({ ctx, status: 'SYNCED' });
    return Result.ok(true);
  } catch (cause) {
    const error = cause instanceof Error ? cause : new Error(String(cause));
    if (ctx.abortController.signal.aborted) {
      return Result.err(createRecoverySyncAbortError());
    }
    if (error.name === 'AbortError') {
      changeSyncStatus({ ctx, status: 'IDLE' });
      return Result.err(error);
    }

    recoverySynclogger.error({ msg: 'Error running manual recovery sync', workspaceId: ctx.workspaceId, error });
    changeSyncStatus({ ctx, status: 'SYNC_FAILED' });
    return Result.err(error);
  }
}
