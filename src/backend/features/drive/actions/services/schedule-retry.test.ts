import { abs } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { calls, mockProps } from '@/tests/vitest/utils.helper.test';
import { scheduleRetry } from './schedule-retry';

describe('schedule-retry', () => {
  const firstRetry = vi.fn();
  const secondRetry = vi.fn();

  let testIndex = 0;
  let props: Parameters<typeof scheduleRetry>[0];

  beforeEach(() => {
    vi.useFakeTimers();
    // Each test uses its own path because pending retries are tracked by path at module level
    props = mockProps<typeof scheduleRetry>({
      ctx: { abortController: new AbortController() },
      path: abs(`/file-${testIndex++}.txt`),
      operation: 'create',
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should replace a pending retry with an earlier one', async () => {
    // When
    scheduleRetry({ ...props, delayMs: 300_000, retry: firstRetry });
    scheduleRetry({ ...props, delayMs: 5000, retry: secondRetry });
    await vi.advanceTimersByTimeAsync(5000);
    // Then
    calls(secondRetry).toHaveLength(1);
    await vi.advanceTimersByTimeAsync(300_000);
    calls(firstRetry).toHaveLength(0);
    calls(secondRetry).toHaveLength(1);
  });

  it('should keep a pending retry that is earlier than the new one', async () => {
    // When
    scheduleRetry({ ...props, delayMs: 5000, retry: firstRetry });
    scheduleRetry({ ...props, delayMs: 300_000, retry: secondRetry });
    await vi.advanceTimersByTimeAsync(300_000);
    // Then
    calls(firstRetry).toHaveLength(1);
    calls(secondRetry).toHaveLength(0);
  });

  it('should schedule a new retry once the pending one has run', async () => {
    // Given
    scheduleRetry({ ...props, delayMs: 5000, retry: firstRetry });
    await vi.advanceTimersByTimeAsync(5000);
    // When
    scheduleRetry({ ...props, delayMs: 300_000, retry: secondRetry });
    await vi.advanceTimersByTimeAsync(300_000);
    // Then
    calls(firstRetry).toHaveLength(1);
    calls(secondRetry).toHaveLength(1);
  });
});
