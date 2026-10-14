import { Result } from '@internxt/drive-desktop-core/build/common/result';
import { changeSyncStatus } from '@/apps/main/remote-sync/RemoteSyncManager';
import { getSyncContexts } from '@/apps/main/remote-sync/store';
import { SyncContext } from '@/apps/sync-engine/config';
import { refreshItemPlaceholders } from '@/apps/sync-engine/refresh-item-placeholders';
import { createRecoverySyncAbortError } from '../common/create-recovery-sync-abort-error';
import { RecoverySyncModule } from '../recovery-sync.module';

/**
 * v2.7.1 Alexis Mora
 * Recovery sync previously ran in the background at worker startup alongside regular sync which refreshed
 * Explorer placeholders independently.
 * Recovery sync purpose is to repair the db state,
 * thats why a manual request needs its own placeholder refresh after recovery completes to apply those repairs to Explorer.
 *
 * Using the shared sync status gives the widget progress and failure feedback and prevents regular sync
 * or another recovery request from starting during recovery and its placeholder refresh.
 * Rejecting requests while sync is busy also avoids starting recovery against a database being updated by regular sync.
 */
export async function runRecoverySyncManually(): Promise<Result<boolean, Error>> {
  const contexts = getSyncContexts();

  if (contexts.length === 0) {
    return Result.err(new Error('No sync workers are available'));
  }

  if (contexts.some((ctx) => ctx.status === 'SYNCING')) {
    return Result.err(new Error('Wait for the current sync to finish before running recovery sync'));
  }

  for (const ctx of contexts) {
    changeSyncStatus({ ctx, status: 'SYNCING' });
  }

  const results = await Promise.all(contexts.map((ctx) => recoverContext({ ctx })));
  const error = results.find((result) => result.error)?.error;
  return error ? Result.err(error) : Result.ok(true);
}

async function recoverContext({ ctx }: { ctx: SyncContext }): Promise<Result<boolean, Error>> {
  try {
    const result = await RecoverySyncModule.recoverySync({ ctx });
    // Logout owns worker cleanup and tray status; cancelled work must not broadcast a later status.
    if (ctx.abortController.signal.aborted) {
      return Result.err(createRecoverySyncAbortError());
    }

    if (result.error) {
      changeSyncStatus({ ctx, status: result.error.name === 'AbortError' ? 'IDLE' : 'SYNC_FAILED' });
      return result;
    }

    await refreshItemPlaceholders({ ctx, isFirstExecution: false });
    if (ctx.abortController.signal.aborted) {
      return Result.err(createRecoverySyncAbortError());
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

    ctx.logger.error({ msg: 'Error running manual recovery sync', error });
    changeSyncStatus({ ctx, status: 'SYNC_FAILED' });
    return Result.err(error);
  }
}
