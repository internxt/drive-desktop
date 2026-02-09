import { waitForDelay } from './wait-for-delay';

describe('waitForDelay', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should clear the pending state after the delay resolves', async () => {
    const state = { pending: null };

    const promise = waitForDelay(state, 100);
    expect(state.pending).not.toBeNull();

    await vi.advanceTimersByTimeAsync(100);
    await promise;

    expect(state.pending).toBeNull();
  });

  it('should share the same delay for concurrent callers instead of creating separate ones', async () => {
    const state = { pending: null };

    const first = waitForDelay(state, 1000);
    const pendingPromise = state.pending;

    const second = waitForDelay(state, 1000);
    const third = waitForDelay(state, 1000);

    expect(state.pending).toBe(pendingPromise);

    await vi.advanceTimersByTimeAsync(1000);
    await Promise.all([first, second, third]);

    expect(state.pending).toBeNull();
  });
});
