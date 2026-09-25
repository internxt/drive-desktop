import { AbsolutePath } from '@internxt/drive-desktop-core/build/backend';
import { SyncContext } from '@/apps/sync-engine/config';
import { Sync } from '@/backend/features/sync';

const IDLE_TIMEOUT_MS = 60_000;
const MAX_WAIT_MS = 2 * 60 * 60_000;
export const RETRY_DELAY_MS = 5 * 60_000;

type RetryKey = `${'create' | 'replace'}:${AbsolutePath}`;

const scheduledRetries = new Set<RetryKey>();

type Props = {
  ctx: SyncContext;
  path: AbsolutePath;
  operation: 'create' | 'replace';
  retry: () => Promise<void>;
};

/**
 * v2.7.0 Victor Fernandez
 * Only the sync engine waits for long copies and retries later. Backups keep the default fixed wait of
 * `waitUntilReady`, otherwise a file that is locked and constantly written (a mailbox, a virtual disk)
 * would block a backup worker for hours on every run.
 * Before this, a file that was not ready was dropped until the next app restart, because the watcher
 * does not emit another event when the copy finishes.
 */
export async function waitForLocalFile({ ctx, path, operation, retry }: Props) {
  const res = await Sync.waitUntilReady({
    path,
    idleTimeoutMs: IDLE_TIMEOUT_MS,
    maxWaitMs: MAX_WAIT_MS,
    abortSignal: ctx.abortController.signal,
  });

  if (res.error && res.error.code !== 'NON_EXISTS' && res.error.code !== 'ABORTED') {
    ctx.logger.warn({ msg: 'File not ready, retry later', path, operation, reason: res.error.code, retryInMs: RETRY_DELAY_MS });
    scheduleRetry({ ctx, path, operation, retry });
  }

  return res;
}

// The key includes the operation because a create retry skips files that became placeholders in the
// meantime, so it cannot stand in for a pending replace of the same path.
function scheduleRetry({ ctx, path, operation, retry }: Props) {
  const key: RetryKey = `${operation}:${path}`;
  if (scheduledRetries.has(key)) return;

  scheduledRetries.add(key);

  setTimeout(() => {
    scheduledRetries.delete(key);
    if (ctx.abortController.signal.aborted) return;
    void retry();
  }, RETRY_DELAY_MS);
}
