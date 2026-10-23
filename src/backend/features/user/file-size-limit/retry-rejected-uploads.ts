import { logger } from '@internxt/drive-desktop-core/build/backend';
import { removeSyncIssuesByError } from '@/apps/main/background-processes/issues';
import { getSyncContexts } from '@/apps/main/remote-sync/store';
import { addPendingItems } from '@/apps/sync-engine/in/add-pending-items';

let retrying: Promise<void> | undefined;

/**
 * v2.7.2 Victor Fernandez
 * Files rejected for their size are only picked up again when the sync engine starts, so when the limit goes up the
 * pending items are added again to upload them without restarting the app.
 */
export function retryRejectedUploads() {
  retrying ??= retry().finally(() => {
    retrying = undefined;
  });

  return retrying;
}

async function retry() {
  const hasRejectedFiles = removeSyncIssuesByError({ error: 'FILE_SIZE_TOO_BIG' });
  if (!hasRejectedFiles) return;

  logger.debug({ tag: 'SYNC-ENGINE', msg: 'Retrying files rejected for their size' });

  await Promise.all(getSyncContexts().map((ctx) => addPendingItems({ ctx })));
}
