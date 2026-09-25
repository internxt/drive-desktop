import { Sync } from '@/backend/features/sync';
import { WaitUntilReadyError } from '@/backend/features/sync/actions/services/wait-until-ready';
import { abs } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { loggerMock } from '@/tests/vitest/mocks.helper.test';
import { call, calls, mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { RETRY_DELAY_MS, waitForLocalFile } from './wait-for-local-file';

describe('wait-for-local-file', () => {
  const waitUntilReadyMock = partialSpyOn(Sync, 'waitUntilReady');
  const retry = vi.fn();

  let abortController: AbortController;
  let testIndex = 0;
  let props: Parameters<typeof waitForLocalFile>[0];

  beforeEach(() => {
    vi.useFakeTimers();
    abortController = new AbortController();
    // Each test uses its own path because pending retries are tracked by path at module level
    props = mockProps<typeof waitForLocalFile>({
      ctx: { logger: loggerMock, abortController },
      path: abs(`/file-${testIndex++}.txt`),
      operation: 'create',
      retry,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should wait with an idle timeout and a long max wait', async () => {
    // Given
    waitUntilReadyMock.mockResolvedValue({ data: true });
    // When
    await waitForLocalFile(props);
    // Then
    call(waitUntilReadyMock).toStrictEqual({
      path: props.path,
      idleTimeoutMs: 60_000,
      maxWaitMs: 7_200_000,
      abortSignal: abortController.signal,
    });
  });

  it('should not retry if the file is ready', async () => {
    // Given
    waitUntilReadyMock.mockResolvedValue({ data: true });
    // When
    const res = await waitForLocalFile(props);
    await vi.advanceTimersByTimeAsync(RETRY_DELAY_MS);
    // Then
    expect(res).toStrictEqual({ data: true });
    calls(retry).toHaveLength(0);
  });

  it('should not retry if the file does not exist anymore', async () => {
    // Given
    waitUntilReadyMock.mockResolvedValue({ error: new WaitUntilReadyError('NON_EXISTS') });
    // When
    await waitForLocalFile(props);
    await vi.advanceTimersByTimeAsync(RETRY_DELAY_MS);
    // Then
    calls(retry).toHaveLength(0);
  });

  it('should not retry if the wait was aborted', async () => {
    // Given
    waitUntilReadyMock.mockResolvedValue({ error: new WaitUntilReadyError('ABORTED') });
    // When
    await waitForLocalFile(props);
    await vi.advanceTimersByTimeAsync(RETRY_DELAY_MS);
    // Then
    calls(retry).toHaveLength(0);
    calls(loggerMock.warn).toHaveLength(0);
  });

  it('should retry after the delay if the file is not ready', async () => {
    // Given
    waitUntilReadyMock.mockResolvedValue({ error: new WaitUntilReadyError('IDLE_TIMEOUT') });
    // When
    const res = await waitForLocalFile(props);
    // Then
    expect(res.error?.code).toBe('IDLE_TIMEOUT');
    call(loggerMock.warn).toMatchObject({ msg: 'File not ready, retry later', path: props.path, reason: 'IDLE_TIMEOUT' });
    await vi.advanceTimersByTimeAsync(RETRY_DELAY_MS - 1);
    calls(retry).toHaveLength(0);
    await vi.advanceTimersByTimeAsync(1);
    calls(retry).toHaveLength(1);
  });

  it('should schedule only one retry per path', async () => {
    // Given
    waitUntilReadyMock.mockResolvedValue({ error: new WaitUntilReadyError('MAX_TIMEOUT') });
    // When
    await waitForLocalFile(props);
    await waitForLocalFile(props);
    await vi.advanceTimersByTimeAsync(RETRY_DELAY_MS);
    // Then
    calls(retry).toHaveLength(1);
  });

  it('should keep one retry per operation for the same path', async () => {
    // Given
    const replaceRetry = vi.fn();
    waitUntilReadyMock.mockResolvedValue({ error: new WaitUntilReadyError('IDLE_TIMEOUT') });
    // When
    await waitForLocalFile(props);
    await waitForLocalFile({ ...props, operation: 'replace', retry: replaceRetry });
    await vi.advanceTimersByTimeAsync(RETRY_DELAY_MS);
    // Then
    calls(retry).toHaveLength(1);
    calls(replaceRetry).toHaveLength(1);
  });

  it('should not retry if the sync engine was stopped', async () => {
    // Given
    waitUntilReadyMock.mockResolvedValue({ error: new WaitUntilReadyError('IDLE_TIMEOUT') });
    // When
    await waitForLocalFile(props);
    abortController.abort();
    await vi.advanceTimersByTimeAsync(RETRY_DELAY_MS);
    // Then
    calls(retry).toHaveLength(0);
  });
});
