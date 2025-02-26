import { RetryError } from './RetryError';
import { RetryHandler } from './RetryHandler';
import { RetryOptions } from './types';

describe('RetryHandler', () => {
  beforeEach(() => {
    jest.useFakeTimers('legacy');
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  const waitForPromises = () =>
    new Promise((resolve) => process.nextTick(resolve));

  const runAndWaitForPromises = async () => {
    jest.runOnlyPendingTimers();
    await waitForPromises();
  };

  it('should retry the function until it succeeds', async () => {
    const mockFn = jest
      .fn()
      .mockRejectedValueOnce(new Error('First attempt failed'))
      .mockResolvedValueOnce('Success');

    const options: RetryOptions = {
      maxRetries: 3,
      initialDelay: 1000,
      jitter: false,
    };

    const promise = RetryHandler.execute(mockFn, options);

    // First attempt: Fails
    await runAndWaitForPromises();
    // Second attempt: Success
    await runAndWaitForPromises();

    const result = await promise;
    expect(result.isLeft()).toBe(false);
    expect(result.getRight()).toBe('Success');
    expect(mockFn).toHaveBeenCalledTimes(2);
  });

  it('should stop retrying after maxRetries is reached', async () => {
    const mockFn = jest.fn().mockRejectedValue(new Error('Always fails'));

    const promise = RetryHandler.execute(mockFn, {
      maxRetries: 2,
      initialDelay: 1000,
    });

    // First attempt: Fails
    await runAndWaitForPromises();
    // Second attempt: Fails
    await runAndWaitForPromises();
    // Third attempt: Fails
    await runAndWaitForPromises();

    jest.advanceTimersByTime(1000);
    jest.advanceTimersByTime(2000);
    jest.advanceTimersByTime(4000);

    const result = await promise;
    expect(result.isLeft()).toBe(true);
    expect(result.getLeft()).toBeInstanceOf(RetryError);
    expect(result.getLeft().message).toBe('Max retries Reached');
    expect(mockFn).toHaveBeenCalledTimes(3);
  });

  it('should abort retry if signal is triggered', async () => {
    const mockFn = jest.fn().mockRejectedValue(new Error('Fail'));

    const abortController = new AbortController();

    const promise = RetryHandler.execute(mockFn, {
      maxRetries: 3,
      initialDelay: 1000,
      signal: abortController.signal,
    });

    // First attempt: Fails
    await runAndWaitForPromises();
    // Mocks the user aborting the operation before the next retry
    abortController.abort();
    // Second attempt: Fails
    await runAndWaitForPromises();

    const result = await promise;
    expect(result.isLeft()).toBe(true);
    expect(result.getLeft()).toBeInstanceOf(RetryError);
    expect(result.getLeft().message).toBe('Retry aborted by signal');

    expect(mockFn).toHaveBeenCalledTimes(2);
  });

  it('should not retry if shouldRetry returns false', async () => {
    jest.useFakeTimers('legacy');

    const mockFn = jest
      .fn()
      .mockRejectedValue(new Error('Non-retriable error'));

    const resultPromise = RetryHandler.execute(mockFn, {
      maxRetries: 3,
      initialDelay: 1000,
      shouldRetry: () => false,
    });

    await runAndWaitForPromises();

    const result = await resultPromise;
    expect(result.isLeft()).toBe(true);
    expect(result.getLeft()).toBeInstanceOf(RetryError);
    expect(result.getLeft().message).toBe('Retry stopped');

    expect(mockFn).toHaveBeenCalledTimes(1);
  });
});
