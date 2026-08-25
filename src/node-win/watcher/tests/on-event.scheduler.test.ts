import { AbsolutePath } from '@internxt/drive-desktop-core/build/backend';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Watcher } from '@/node-win/addon';
import { createWatcherEventScheduler } from '../on-event/event-scheduler/watcher-event-scheduler';

const event = (internalId: number, size = 1): Watcher.SuccessEvent => ({
  action: 'create',
  type: 'file',
  path: `C:\\Sync\\${internalId}` as AbsolutePath,
  size,
  internalId,
  ctimeMs: 0,
  mtimeMs: 0,
});

describe('watcher event scheduler', () => {
  afterEach(() => vi.useRealTimers());

  it('dispatches only the newest event after that item has been quiet for the debounce period', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'setImmediate', 'clearImmediate', 'Date'] });
    const dispatch = vi.fn().mockResolvedValue(undefined);
    const scheduler = createWatcherEventScheduler({ debounceMs: 20, dispatch });

    scheduler.add(event(1, 1));
    await vi.advanceTimersByTimeAsync(10);
    scheduler.add(event(1, 2));
    await vi.advanceTimersByTimeAsync(10);
    expect(dispatch).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(10);
    await vi.runAllTimersAsync();
    expect(dispatch).toHaveBeenCalledOnce();
    expect(dispatch).toHaveBeenCalledWith(expect.objectContaining({ internalId: 1, size: 2 }));
  });

  it('keeps one active debounce timer for many distinct items', () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'setImmediate', 'clearImmediate', 'Date'] });
    const scheduler = createWatcherEventScheduler({ debounceMs: 20, dispatch: vi.fn().mockResolvedValue(undefined) });

    for (let internalId = 0; internalId < 10_000; internalId += 1) scheduler.add(event(internalId));

    expect(vi.getTimerCount()).toBe(1);
    expect(scheduler.stats()).toMatchObject({ received: 10_000, coalesced: 10_000, active: 0, timerScheduled: true });
  });

  it('never exceeds configured processing concurrency', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'setImmediate', 'clearImmediate', 'Date'] });
    let active = 0;
    let maximumActive = 0;
    const resolvers: Array<() => void> = [];
    const dispatch = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          active += 1;
          maximumActive = Math.max(maximumActive, active);
          resolvers.push(() => {
            active -= 1;
            resolve();
          });
        }),
    );
    const scheduler = createWatcherEventScheduler({ debounceMs: 20, dispatch, concurrency: 2, batchSize: 2 });

    for (let internalId = 0; internalId < 5; internalId += 1) scheduler.add(event(internalId));
    await vi.advanceTimersByTimeAsync(20);
    await vi.runAllTimersAsync();
    expect(dispatch).toHaveBeenCalledTimes(2);

    resolvers.splice(0).forEach((resolve) => resolve());
    await vi.runAllTimersAsync();
    resolvers.splice(0).forEach((resolve) => resolve());
    await vi.runAllTimersAsync();
    resolvers.splice(0).forEach((resolve) => resolve());
    await vi.runAllTimersAsync();

    expect(dispatch).toHaveBeenCalledTimes(5);
    expect(maximumActive).toBe(2);
    expect(scheduler.stats().active).toBe(0);
  });

  it('waits for active processing before dispatching a newer event for the same item', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'setImmediate', 'clearImmediate', 'Date'] });
    let resolveFirst: (() => void) | undefined;
    const dispatch = vi.fn().mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          resolveFirst = resolve;
        }),
    );
    dispatch.mockResolvedValueOnce(undefined);
    const scheduler = createWatcherEventScheduler({ debounceMs: 20, dispatch });

    scheduler.add(event(1, 1));
    await vi.advanceTimersByTimeAsync(20);
    await vi.runAllTimersAsync();
    scheduler.add(event(1, 2));
    await vi.advanceTimersByTimeAsync(20);
    await vi.runAllTimersAsync();
    expect(dispatch).toHaveBeenCalledOnce();

    resolveFirst?.();
    await vi.runAllTimersAsync();

    expect(dispatch).toHaveBeenCalledTimes(2);
    expect(dispatch).toHaveBeenLastCalledWith(expect.objectContaining({ internalId: 1, size: 2 }));
  });

  it('does not start pending work after disposal', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'setImmediate', 'clearImmediate', 'Date'] });
    const dispatch = vi.fn().mockResolvedValue(undefined);
    const scheduler = createWatcherEventScheduler({ debounceMs: 20, dispatch });

    scheduler.add(event(1));
    scheduler.dispose();
    await vi.runAllTimersAsync();

    expect(dispatch).not.toHaveBeenCalled();
    expect(scheduler.stats()).toMatchObject({ coalesced: 0, active: 0, timerScheduled: false });
  });
});
