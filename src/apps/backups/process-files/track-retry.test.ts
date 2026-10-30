import { trackRetry } from './track-retry';

describe('track-retry', () => {
  it('should not retry if retryLater was not called', () => {
    // When
    const retry = trackRetry();
    // Then
    expect(retry.willRetry()).toBe(false);
    expect(retry.next()).toBeUndefined();
  });

  it('should keep the next attempt when retryLater is called', () => {
    // Given
    const retry = trackRetry();
    // When
    retry.retryLater({ attempt: 2, delayMs: 5000 });
    // Then
    expect(retry.willRetry()).toBe(true);
    expect(retry.next()).toStrictEqual({ attempt: 2, delayMs: 5000 });
  });
});
