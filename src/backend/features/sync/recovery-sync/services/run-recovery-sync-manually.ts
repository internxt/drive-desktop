import { Result } from '@internxt/drive-desktop-core/build/common/result';
import { changeSyncStatus } from '@/apps/main/remote-sync/RemoteSyncManager';
import { getSyncContexts } from '@/apps/main/remote-sync/store';
import { runRecoveryWithPreservation } from './run-recovery-with-preservation';

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

  return await runRecoveryWithPreservation({ contexts });
}
