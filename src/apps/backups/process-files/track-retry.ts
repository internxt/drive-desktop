import { RetryLater } from '@/backend/features/sync/actions/services/upload-file';

type NextRetry = Parameters<RetryLater>[0];

export function trackRetry() {
  let next: NextRetry | undefined;

  return {
    retryLater: ((props) => (next = props)) satisfies RetryLater,
    willRetry: () => next !== undefined,
    next: () => next,
  };
}
