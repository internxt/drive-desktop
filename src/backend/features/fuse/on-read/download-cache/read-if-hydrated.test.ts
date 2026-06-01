import { readIfHydrated } from './read-if-hydrated';
import {
  clearHydrationState,
  getExistingHydrationState,
  getOrCreateHydrationState,
  markBlocksInRangeDownloaded,
} from './hydration-state';
import { readChunkFromDisk } from '../read-chunk-from-disk';

vi.mock('../read-chunk-from-disk', () => ({
  readChunkFromDisk: vi.fn(),
}));

const readChunkFromDiskMock = vi.mocked(readChunkFromDisk);

describe('readIfHydrated', () => {
  beforeEach(() => {
    clearHydrationState();
  });

  it('returns undefined when no hydration state exists', async () => {
    const result = await readIfHydrated('/tmp/cache-file', 'contents-id', { position: 0, length: 10 });

    expect(result).toBeUndefined();
  });

  it('does not create hydration state when no hydration state exists', async () => {
    await readIfHydrated('/tmp/cache-file', 'contents-id', { position: 0, length: 10 });

    expect(getExistingHydrationState('contents-id')).toBeUndefined();
  });

  it('returns undefined when the requested range is not hydrated', async () => {
    getOrCreateHydrationState('contents-id', 1024);

    const result = await readIfHydrated('/tmp/cache-file', 'contents-id', { position: 0, length: 10 });

    expect(result).toBeUndefined();
    expect(readChunkFromDiskMock).not.toHaveBeenCalled();
  });

  it('reads bytes from disk when the requested range is hydrated', async () => {
    const chunk = Buffer.from('cached');
    const state = getOrCreateHydrationState('contents-id', 1024);
    markBlocksInRangeDownloaded(state, { position: 0, length: 10 });
    readChunkFromDiskMock.mockResolvedValue(chunk);

    const result = await readIfHydrated('/tmp/cache-file', 'contents-id', { position: 0, length: 10 });

    expect(result).toBe(chunk);
    expect(readChunkFromDiskMock).toHaveBeenCalledWith('/tmp/cache-file', 10, 0);
  });
});
