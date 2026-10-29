import { logger } from '@internxt/drive-desktop-core/build/backend';
import { existsSync } from 'node:fs';
import { issues, removeSyncIssue } from '@/apps/main/background-processes/issues';
import { getSyncContextFromPath } from '@/apps/main/electron/share/get-sync-context-from-path';
import { SyncContext } from '@/apps/sync-engine/config';
import { addPendingItems } from '@/apps/sync-engine/in/add-pending-items';
import { abs } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { NodeWin } from '@/infra/node-win/node-win.module';

let retrying: Promise<void> | undefined;

/**
 * v2.7.2 Victor Fernandez
 * Files rejected for their size are only picked up again when the sync engine starts, so when the limit goes up the
 * pending items are added again to upload them without restarting the app.
 * Adding the pending items only uploads files that are not placeholders yet, so the issue is kept for modified files
 * and for files outside an active sync context: they are not retried and the user must still see them.
 */
export function retryRejectedUploads() {
  retrying ??= retry().finally(() => {
    retrying = undefined;
  });

  return retrying;
}

async function retry() {
  const rejectedNames = issues.filter((i) => i.tab === 'sync' && i.error === 'FILE_SIZE_TOO_BIG').map((i) => i.name);
  const contexts = new Set<SyncContext>();

  for (const name of rejectedNames) {
    const path = abs(name);

    if (!existsSync(path)) {
      removeSyncIssue({ name, error: 'FILE_SIZE_TOO_BIG' });
      continue;
    }

    const ctx = getSyncContextFromPath(path);
    if (!ctx) continue;

    const { error } = await NodeWin.getFileInfo({ path });
    if (error?.code !== 'NOT_A_PLACEHOLDER') continue;

    removeSyncIssue({ name, error: 'FILE_SIZE_TOO_BIG' });
    contexts.add(ctx);
  }

  if (contexts.size === 0) return;

  logger.debug({ tag: 'SYNC-ENGINE', msg: 'Retrying files rejected for their size' });

  await Promise.allSettled([...contexts].map((ctx) => addPendingItems({ ctx })));
}
