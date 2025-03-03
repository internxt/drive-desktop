import { Either, left, right } from '../../../context/shared/domain/Either';
import { RetryError } from './RetryError';
import { RetryOptions } from './types';
import Logger from 'electron-log';

const DEFAULT_MAX_DELAY = 30000;
const DEFAULT_BACKOFF_FACTOR = 2;

/**
 * Handler made for executing operations with a retry mechanism.
 * It supports exponential backoff, jitter, and customizable retry logic.
 */
export class RetryHandler {
  /**
   * Executes a function with retry logic based on the provided options.
   *
   * @template T The type of the function's return value.
   * @param fn - The asynchronous function to be executed with retries.
   * @param options - Configuration for retry behavior, see {@link RetryOptions}.
   * @returns A promise resolving to an `Either<RetryError, T>`, where:
   *          - `right(T)`: The function succeeds within the retry limit.
   *          - `left(RetryError)`: Retries exhausted or aborted.
   */
  static async execute<T>(
    fn: () => Promise<T>,
    options: RetryOptions
  ): Promise<Either<RetryError, T>> {
    const {
      maxRetries,
      initialDelay,
      maxDelay = DEFAULT_MAX_DELAY,
      backoffFactor = DEFAULT_BACKOFF_FACTOR,
      jitter = true,
      shouldRetry = () => true,
      signal,
    } = options;

    let attempt = 0;
    let delay = initialDelay;

    while (attempt <= maxRetries) {
      try {
        // * In this case, we need to wait for the promise to resolve in order to return the value
        // eslint-disable-next-line no-await-in-loop
        const result = await fn();
        if (result instanceof Error) {
          throw result;
        }
        return right(result);
      } catch (error) {
        if (!this.shouldKeepTrying(attempt, maxRetries, shouldRetry, error)) {
          return left(new RetryError('Retry stopped'));
        }

        if (signal?.aborted) {
          return left(new RetryError('Retry aborted by signal'));
        }

        attempt++;
        // eslint-disable-next-line no-await-in-loop
        await this.waitBeforeRetry(delay, maxDelay, jitter, attempt, error);

        delay *= backoffFactor;
      }
    }

    return left(new RetryError('Max retries Reached'));
  }

  private static shouldKeepTrying(
    attempt: number,
    maxRetries: number,
    shouldRetry: (error: unknown) => boolean,
    error: unknown
  ): boolean {
    return attempt <= maxRetries && (!shouldRetry || shouldRetry(error));
  }

  private static getWaitingTime(
    delay: number,
    maxDelay: number,
    jitter: boolean
  ): number {
    const jitterFactor = jitter ? Math.random() + 0.5 : 1;
    return Math.min(delay * jitterFactor, maxDelay);
  }

  private static async waitBeforeRetry(
    delay: number,
    maxDelay: number,
    jitter: boolean,
    attempt: number,
    error: unknown
  ): Promise<void> {
    const waitTime = this.getWaitingTime(delay, maxDelay, jitter);
    Logger.warn(
      `[Retry] Attempt ${attempt} failed, retrying in ${Math.round(
        waitTime
      )}ms...`,
      error
    );

    await new Promise((resolve) => setTimeout(resolve, waitTime));
  }
}
