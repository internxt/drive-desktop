import {
  abortAllHydrations,
  abortHydrationState,
  clearHydrationState,
  ensureAllocatedOnce,
  finalizeIfNeeded,
  getExistingHydrationState,
  getHydratedBytes,
  getOrCreateHydrationState,
  isFileHydrated,
  markBlocksInRangeDownloaded,
  markFinalized,
} from './hydration-state';
import { allocateFile } from './allocate-file';
import { BLOCK_SIZE } from './constants';

vi.mock('./allocate-file', () => ({
  allocateFile: vi.fn(),
}));

const allocateFileMock = vi.mocked(allocateFile);

describe('hydration-state lifecycle', () => {
  beforeEach(() => {
    clearHydrationState();
  });

  it('reads an existing state without creating a new one', () => {
    const created = getOrCreateHydrationState('contents-id', 1024);

    const existing = getExistingHydrationState('contents-id');

    expect(existing).toBe(created);
  });

  it('does not create state when reading a missing contents id', () => {
    const missing = getExistingHydrationState('missing');

    expect(missing).toBeUndefined();
    expect(getExistingHydrationState('missing')).toBeUndefined();
  });

  it('creates state once per contents id', () => {
    const first = getOrCreateHydrationState('contents-id', 1024);
    const second = getOrCreateHydrationState('contents-id', 2048);

    expect(second).toBe(first);
  });

  it('creates new states with a fresh AbortController and unfinished finalization state', () => {
    const first = getOrCreateHydrationState('first', 1024);
    const second = getOrCreateHydrationState('second', 1024);

    expect(first.abortController).toBeInstanceOf(AbortController);
    expect(second.abortController).toBeInstanceOf(AbortController);
    expect(first.abortController).not.toBe(second.abortController);
    expect(first.fileSize).toBe(1024);
    expect(first.hydratedBytes).toBe(0);
    expect(first.finalized).toBe(false);
    expect(first.finalization).toBeUndefined();
  });

  it('aborts one hydration state without aborting another', () => {
    const first = getOrCreateHydrationState('first', 1024);
    const second = getOrCreateHydrationState('second', 1024);

    abortHydrationState(first);

    expect(first.abortController.signal.aborted).toBe(true);
    expect(second.abortController.signal.aborted).toBe(false);
  });

  it('aborts every hydration state', () => {
    const first = getOrCreateHydrationState('first', 1024);
    const second = getOrCreateHydrationState('second', 1024);

    expect(first.abortController.signal.aborted).toBe(false);
    expect(second.abortController.signal.aborted).toBe(false);
    abortAllHydrations();

    expect(first.abortController.signal.aborted).toBe(true);
    expect(second.abortController.signal.aborted).toBe(true);
  });

  it('reuses the in-flight repository registration for concurrent finalization attempts', () => {
    const state = getOrCreateHydrationState('contents-id', 1024);
    const promise = new Promise<void>(() => undefined);

    const first = finalizeIfNeeded(state, () => promise);
    const second = finalizeIfNeeded(state, () => Promise.resolve());

    expect(second).toBe(first);
    expect(state.finalization).toBe(first);
    expect(state.finalized).toBe(false);
  });

  it('allows failed finalization to be retried', async () => {
    const state = getOrCreateHydrationState('contents-id', 1024);

    await expect(finalizeIfNeeded(state, () => Promise.reject(new Error('register failed')))).rejects.toThrow(
      'register failed',
    );

    expect(state.finalization).toBeUndefined();
    expect(state.finalized).toBe(false);

    await finalizeIfNeeded(state, () => Promise.resolve());

    expect(state.finalized).toBe(true);
  });

  it('marks successful finalization as finalized', async () => {
    const state = getOrCreateHydrationState('contents-id', 1024);

    await finalizeIfNeeded(state, () => Promise.resolve());

    expect(state.finalized).toBe(true);
    expect(state.finalization).toBeUndefined();
  });

  it('can mark a state as finalized directly', () => {
    const state = getOrCreateHydrationState('contents-id', 1024);

    markFinalized(state);

    expect(state.finalized).toBe(true);
  });

  it('reports hydrated bytes from completed blocks only', () => {
    const fileSize = BLOCK_SIZE * 2 + 123;
    const state = getOrCreateHydrationState('contents-id', fileSize);

    markBlocksInRangeDownloaded(state, { position: 0, length: BLOCK_SIZE });

    expect(getHydratedBytes(state)).toBe(BLOCK_SIZE);
  });

  it('counts the final block by its actual byte length', () => {
    const fileSize = BLOCK_SIZE * 2 + 123;
    const state = getOrCreateHydrationState('contents-id', fileSize);

    markBlocksInRangeDownloaded(state, { position: BLOCK_SIZE * 2, length: 123 });

    expect(getHydratedBytes(state)).toBe(123);
  });

  it('reports full file size when every block is hydrated', () => {
    const fileSize = BLOCK_SIZE + 123;
    const state = getOrCreateHydrationState('contents-id', fileSize);

    markBlocksInRangeDownloaded(state, { position: 0, length: BLOCK_SIZE });
    markBlocksInRangeDownloaded(state, { position: BLOCK_SIZE, length: 123 });

    expect(getHydratedBytes(state)).toBe(fileSize);
  });

  it('counts hydrated bytes only once when the same block is marked again', () => {
    const fileSize = BLOCK_SIZE + 123;
    const state = getOrCreateHydrationState('contents-id', fileSize);

    markBlocksInRangeDownloaded(state, { position: 0, length: BLOCK_SIZE });
    markBlocksInRangeDownloaded(state, { position: 10, length: 10 });

    expect(getHydratedBytes(state)).toBe(BLOCK_SIZE);
  });

  it('treats an empty file as fully hydrated without marking any blocks', () => {
    const state = getOrCreateHydrationState('empty-contents-id', 0);

    expect(isFileHydrated(state)).toBe(true);
    expect(getHydratedBytes(state)).toBe(0);
  });

  describe('file allocation', () => {
    it('allocates a file only once for concurrent callers', async () => {
      const state = getOrCreateHydrationState('contents-id', 1024);
      let resolveAllocation: () => void = () => undefined;
      allocateFileMock.mockReturnValue(
        new Promise<void>((resolve) => {
          resolveAllocation = resolve;
        }),
      );

      const first = ensureAllocatedOnce(state, '/tmp/cache-file', 1024);
      const second = ensureAllocatedOnce(state, '/tmp/cache-file', 1024);

      expect(first).toBe(second);
      expect(allocateFileMock).toHaveBeenCalledOnce();
      expect(allocateFileMock).toHaveBeenCalledWith('/tmp/cache-file', 1024);

      resolveAllocation();
      await expect(first).resolves.toStrictEqual({ data: undefined });
      await expect(second).resolves.toStrictEqual({ data: undefined });
    });

    it('keeps successful allocation in state so later callers reuse it', async () => {
      const state = getOrCreateHydrationState('contents-id', 1024);
      allocateFileMock.mockResolvedValue(undefined);

      const first = ensureAllocatedOnce(state, '/tmp/cache-file', 1024);
      await expect(first).resolves.toStrictEqual({ data: undefined });
      const second = ensureAllocatedOnce(state, '/tmp/cache-file', 1024);

      expect(second).toBe(first);
      expect(allocateFileMock).toHaveBeenCalledOnce();
    });

    it('allows failed allocation to be retried', async () => {
      const state = getOrCreateHydrationState('contents-id', 1024);
      allocateFileMock.mockRejectedValueOnce(new Error('allocation failed')).mockResolvedValueOnce(undefined);

      await expect(ensureAllocatedOnce(state, '/tmp/cache-file', 1024)).resolves.toStrictEqual({
        error: new Error('allocation failed'),
      });

      expect(state.allocation).toBeUndefined();

      await expect(ensureAllocatedOnce(state, '/tmp/cache-file', 1024)).resolves.toStrictEqual({ data: undefined });

      expect(allocateFileMock).toHaveBeenCalledTimes(2);
    });

    it('starts the state stopwatch when allocation begins', async () => {
      const state = getOrCreateHydrationState('contents-id', 1024);
      allocateFileMock.mockResolvedValue(undefined);

      await expect(ensureAllocatedOnce(state, '/tmp/cache-file', 1024)).resolves.toStrictEqual({ data: undefined });

      expect(state.stopwatch).toBeDefined();
      expect(state.stopwatch?.elapsedTime()).not.toBe(-1);
    });
  });
});
