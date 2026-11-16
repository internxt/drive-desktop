import { AbsolutePath } from '@internxt/drive-desktop-core/build/backend';
import { SyncContext } from '@/apps/sync-engine/config';

export type Operation = 'create' | 'replace';
type RetryKey = `${Operation}:${AbsolutePath}`;

type ScheduledRetry = { dueAt: number; cancel: () => void };

const scheduledRetries = new Map<RetryKey, ScheduledRetry>();

type Props = {
  ctx: SyncContext;
  path: AbsolutePath;
  operation: Operation;
  delayMs: number;
  retry: () => Promise<void>;
};

/**
 * v2.7.0 Victor Fernandez
 * The key includes the operation because a create retry skips files that became placeholders in the
 * meantime, so it cannot stand in for a pending replace of the same path.
 * The retry is cancelled as soon as the sync engine stops: if the user logs out and in again before the
 * delay, a pending key from the old session would otherwise block the retry of the new one.
 */
export function scheduleRetry({ ctx, path, operation, delayMs, retry }: Props) {
  const key: RetryKey = `${operation}:${path}`;
  const { signal } = ctx.abortController;
  if (signal.aborted) return;

  const dueAt = Date.now() + delayMs;
  const scheduled = scheduledRetries.get(key);

  /**
   * v2.7.2 Victor Fernandez
   * A failed upload retries in seconds while a file that was not ready waits minutes, and both share the key.
   * The earlier one wins, so a pending wait for the file does not hold back the retry of an upload.
   */
  if (scheduled && scheduled.dueAt <= dueAt) return;
  scheduled?.cancel();

  let timeout: NodeJS.Timeout | undefined = undefined;

  function cancel() {
    clearTimeout(timeout);
    signal.removeEventListener('abort', cancel);
    scheduledRetries.delete(key);
  }

  timeout = setTimeout(() => {
    cancel();
    void retry();
  }, delayMs);

  scheduledRetries.set(key, { dueAt, cancel });
  signal.addEventListener('abort', cancel, { once: true });
}
