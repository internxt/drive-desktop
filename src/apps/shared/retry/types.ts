/**
 * Configuration options for the retry mechanism.
 */
export type RetryOptions = {
  /**
   * Maximum number of retry attempts before failing.
   * If set to 3, the function will be tried up to 4 times (1 initial + 3 retries).
   */
  maxRetries: number;

  /**
   * Initial delay before the first retry attempt, in milliseconds.
   * Example: If set to 1000, the first retry will happen 1 second after failure.
   */
  initialDelay: number;

  /**
   * Maximum delay between retry attempts, in milliseconds.
   * Prevents the backoff from growing indefinitely.
   * If undefined, no upper limit is enforced.
   */
  maxDelay?: number;

  /**
   * Multiplicative factor for increasing the retry delay.
   * Defaults to `2`, meaning each subsequent retry waits twice as long.
   * Example: If `initialDelay = 1000` and `backoffFactor = 2`, retry intervals would be:
   * 1000ms → 2000ms → 4000ms → 8000ms.
   */
  backoffFactor?: number;

  /**
   * Whether to add a random variation (jitter) to the retry delay.
   * This helps prevent multiple clients from retrying simultaneously (thundering herd problem).
   * - If `true`, the delay will be slightly randomized.
   * - If `false`, the delay follows strict exponential backoff.
   */
  jitter?: boolean;

  /**
   * A function that determines whether a retry should be attempted based on the error.
   * - If the function returns `true`, the operation is retried.
   * - If it returns `false`, the retry process stops immediately.
   * Useful for distinguishing between transient errors (e.g., network failures) and fatal errors (e.g., disk full).
   *
   * @param error - The error that occurred during execution.
   * @returns `true` if the operation should be retried, `false` otherwise.
   */
  shouldRetry?: (error: unknown) => boolean;

  /**
   * Optional signal that allows cancellation of the retry process.
   * If `AbortSignal` is triggered, all retries are stopped immediately.
   * Useful for user-initiated cancellations or when a certain condition is met.
   */
  signal?: AbortSignal;
};
