type NextRetry = { attempt: number; delayMs: number };

export type RetryLater = (props: NextRetry) => void;

export function trackRetry() {
  let next: NextRetry | undefined;

  return {
    retryLater: ((props) => (next = props)) satisfies RetryLater,
    willRetry: () => next !== undefined,
    next: () => next,
  };
}
