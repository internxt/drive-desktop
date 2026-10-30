import { AbsolutePath } from '@internxt/drive-desktop-core/build/backend';
import { SyncContext } from '@/apps/sync-engine/config';

export type Operation = 'create' | 'replace';
type RetryKey = `${Operation}:${AbsolutePath}`;

const scheduledRetries = new Set<RetryKey>();

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
  if (signal.aborted || scheduledRetries.has(key)) return;

  scheduledRetries.add(key);

  let timeout: NodeJS.Timeout | undefined = undefined;

  function cancel() {
    clearTimeout(timeout);
    scheduledRetries.delete(key);
  }

  timeout = setTimeout(() => {
    signal.removeEventListener('abort', cancel);
    scheduledRetries.delete(key);
    void retry();
  }, delayMs);

  signal.addEventListener('abort', cancel, { once: true });
}
