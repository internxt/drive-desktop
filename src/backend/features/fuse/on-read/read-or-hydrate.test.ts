import { type File } from '../../../../context/virtual-drive/files/domain/File';
import { FuseIOError } from '../../../../apps/drive/fuse/callbacks/FuseErrors';
import { call, partialSpyOn, testSleep } from '../../../../../tests/vitest/utils.helper';
import * as readChunkModule from './read-chunk-from-disk';
import * as fileExistsModule from './download-cache/file-exists-on-disk';
import * as allocateFileModule from './download-cache/allocate-file';
import * as downloadAndSaveBlockModule from './download-cache/download-and-save-block';
import {
  clearHydrationState,
  getExistingHydrationState,
  getOrCreateHydrationState,
  isRangeHydrated,
  markBlocksInRangeDownloaded,
} from './download-cache/hydration-state';
import { BLOCK_SIZE } from './download-cache/constants';
import { readOrHydrate, type ReadOrHydrateDeps } from './read-or-hydrate';

const readChunkFromDiskMock = partialSpyOn(readChunkModule, 'readChunkFromDisk');
const fileExistsOnDiskMock = partialSpyOn(fileExistsModule, 'fileExistsOnDisk');
const allocateFileMock = partialSpyOn(allocateFileModule, 'allocateFile');
const downloadAndCacheBlockMock = partialSpyOn(downloadAndSaveBlockModule, 'downloadAndCacheBlock');

const virtualFile = {
  contentsId: 'contents-123',
  name: 'video',
  nameWithExtension: 'video.mp4',
  type: 'mp4',
  uuid: 'uuid-123',
  size: 1000,
} as unknown as File;

function createDeps(overrides: Partial<ReadOrHydrateDeps> = {}): ReadOrHydrateDeps {
  return {
    onDownloadProgress: vi.fn(),
    saveToRepository: vi.fn().mockResolvedValue(undefined),
    bucketId: 'bucket-id',
    mnemonic: 'mnemonic',
    network: {} as ReadOrHydrateDeps['network'],
    ...overrides,
  };
}

describe('readOrHydrate', () => {
  beforeEach(() => {
    clearHydrationState();
    vi.clearAllMocks();
    fileExistsOnDiskMock.mockResolvedValue(true);
    allocateFileMock.mockResolvedValue(undefined);
    downloadAndCacheBlockMock.mockResolvedValue({ data: undefined });
    readChunkFromDiskMock.mockResolvedValue(Buffer.from('data'));
  });

  it('reads an already hydrated range from disk without downloading', async () => {
    const chunk = Buffer.from('cached');
    const state = getOrCreateHydrationState(virtualFile.contentsId, virtualFile.size);
    markBlocksInRangeDownloaded(state, { position: 0, length: 10 });
    readChunkFromDiskMock.mockResolvedValue(chunk);

    const result = await readOrHydrate({
      ...createDeps(),
      virtualFile,
      filePath: '/tmp/cache-file',
      range: { position: 0, length: 10 },
    });

    expect(result.data).toBe(chunk);
    expect(downloadAndCacheBlockMock).not.toHaveBeenCalled();
    expect(readChunkFromDiskMock).toHaveBeenCalledWith('/tmp/cache-file', 10, 0);
  });

  it('downloads a missing range then reads requested bytes from disk', async () => {
    const chunk = Buffer.from('downloaded');
    readChunkFromDiskMock.mockResolvedValue(chunk);
    const deps = createDeps();

    const result = await readOrHydrate({
      ...deps,
      virtualFile,
      filePath: '/tmp/cache-file',
      range: { position: 0, length: 10 },
    });

    expect(result.data).toBe(chunk);
    expect(downloadAndCacheBlockMock).toHaveBeenCalledOnce();
    expect(readChunkFromDiskMock).toHaveBeenCalledWith('/tmp/cache-file', 10, 0);
  });

  it('creates hydration state for normal reads', async () => {
    await readOrHydrate({
      ...createDeps(),
      virtualFile,
      filePath: '/tmp/cache-file',
      range: { position: 0, length: 10 },
    });

    expect(getExistingHydrationState(virtualFile.contentsId)).toBeDefined();
  });

  it('allocates the cache file when it is missing', async () => {
    fileExistsOnDiskMock.mockResolvedValue(false);

    await readOrHydrate({
      ...createDeps(),
      virtualFile,
      filePath: '/tmp/cache-file',
      range: { position: 0, length: 10 },
    });

    expect(allocateFileMock).toHaveBeenCalledWith('/tmp/cache-file', virtualFile.size);
  });

  it('passes progress reporting through to block hydration', async () => {
    const deps = createDeps();
    downloadAndCacheBlockMock.mockImplementation(async ({ onDownloadProgress }) => {
      onDownloadProgress(virtualFile.name, virtualFile.type, 10, virtualFile.size, 1);
      return { data: undefined };
    });

    await readOrHydrate({
      ...deps,
      virtualFile,
      filePath: '/tmp/cache-file',
      range: { position: 0, length: 10 },
    });

    call(deps.onDownloadProgress).toStrictEqual([virtualFile.name, virtualFile.type, 10, virtualFile.size, 1]);
  });

  it('returns empty when in-flight hydration is aborted before the read resolves', async () => {
    downloadAndCacheBlockMock.mockImplementation(async () => {
      const state = getExistingHydrationState(virtualFile.contentsId);
      state?.abortController.abort();
      return { data: undefined };
    });

    const result = await readOrHydrate({
      ...createDeps(),
      virtualFile,
      filePath: '/tmp/cache-file',
      range: { position: 0, length: 10 },
    });

    expect(result.data).toStrictEqual(Buffer.alloc(0));
    expect(readChunkFromDiskMock).not.toHaveBeenCalled();
  });

  it('returns non-abort download errors', async () => {
    downloadAndCacheBlockMock.mockResolvedValue({ error: new Error('network failed') });

    const result = await readOrHydrate({
      ...createDeps(),
      virtualFile,
      filePath: '/tmp/cache-file',
      range: { position: 0, length: 10 },
    });

    expect(result.error).toBeInstanceOf(FuseIOError);
    expect(result.error?.message).toContain('network failed');
  });

  it('returns allocation errors as Fuse IO errors', async () => {
    fileExistsOnDiskMock.mockResolvedValue(false);
    allocateFileMock.mockRejectedValue(new Error('disk full'));

    const result = await readOrHydrate({
      ...createDeps(),
      virtualFile,
      filePath: '/tmp/cache-file',
      range: { position: 0, length: 10 },
    });

    expect(result.error).toBeInstanceOf(FuseIOError);
  });

  it('downloads one block once for overlapping concurrent reads', async () => {
    let resolveDownload: () => void = () => undefined;
    downloadAndCacheBlockMock.mockImplementation(
      ({ state, blockStart, blockLength }) =>
        new Promise<{ data: undefined }>((resolve) => {
          resolveDownload = () => {
            markBlocksInRangeDownloaded(state, { position: blockStart, length: blockLength });
            resolve({ data: undefined });
          };
        }),
    );

    const first = readOrHydrate({
      ...createDeps(),
      virtualFile,
      filePath: '/tmp/cache-file',
      range: { position: 0, length: 10 },
    });
    const second = readOrHydrate({
      ...createDeps(),
      virtualFile,
      filePath: '/tmp/cache-file',
      range: { position: 5, length: 10 },
    });

    await testSleep(0);
    expect(downloadAndCacheBlockMock).toHaveBeenCalledOnce();

    resolveDownload();

    await expect(first).resolves.toHaveProperty('data', Buffer.from('data'));
    await expect(second).resolves.toHaveProperty('data', Buffer.from('data'));
    expect(getExistingHydrationState(virtualFile.contentsId)?.blocksBeingDownloaded.size).toBe(0);
    expect(downloadAndCacheBlockMock).toHaveBeenCalledOnce();
  });

  it('keeps overlapping reads waiting on the existing block download promise', async () => {
    let resolveDownload: () => void = () => undefined;
    let secondSettled = false;
    downloadAndCacheBlockMock.mockImplementation(
      ({ state, blockStart, blockLength }) =>
        new Promise<{ data: undefined }>((resolve) => {
          resolveDownload = () => {
            markBlocksInRangeDownloaded(state, { position: blockStart, length: blockLength });
            resolve({ data: undefined });
          };
        }),
    );

    const first = readOrHydrate({
      ...createDeps(),
      virtualFile,
      filePath: '/tmp/cache-file',
      range: { position: 0, length: 10 },
    });
    const second = readOrHydrate({
      ...createDeps(),
      virtualFile,
      filePath: '/tmp/cache-file',
      range: { position: 5, length: 10 },
    }).then((result) => {
      secondSettled = true;
      return result;
    });

    await testSleep(0);
    expect(secondSettled).toBe(false);

    resolveDownload();
    await Promise.all([first, second]);

    expect(secondSettled).toBe(true);
  });

  it('settles overlapping waiters with the failed block download result', async () => {
    let resolveDownload: (result: { error: Error }) => void = () => undefined;
    downloadAndCacheBlockMock.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveDownload = resolve;
        }),
    );

    const first = readOrHydrate({
      ...createDeps(),
      virtualFile,
      filePath: '/tmp/cache-file',
      range: { position: 0, length: 10 },
    });
    const second = readOrHydrate({
      ...createDeps(),
      virtualFile,
      filePath: '/tmp/cache-file',
      range: { position: 5, length: 10 },
    });

    await testSleep(0);
    resolveDownload({ error: new Error('range request failed') });

    const firstResult = await first;
    const secondResult = await second;
    const state = getExistingHydrationState(virtualFile.contentsId);

    expect(firstResult.error).toBeInstanceOf(FuseIOError);
    expect(secondResult.error).toBeInstanceOf(FuseIOError);
    expect(firstResult.error?.message).toContain('range request failed');
    expect(secondResult.error?.message).toContain('range request failed');
    expect(downloadAndCacheBlockMock).toHaveBeenCalledOnce();
    expect(state?.blocksBeingDownloaded.size).toBe(0);
    expect(state && isRangeHydrated(state, { position: 0, length: 10 })).toBe(false);
  });

  it('does not mark failed block downloads as hydrated and allows a later retry', async () => {
    downloadAndCacheBlockMock
      .mockResolvedValueOnce({ error: new Error('range request failed') })
      .mockImplementationOnce(async ({ state, blockStart, blockLength }) => {
        markBlocksInRangeDownloaded(state, { position: blockStart, length: blockLength });
        return { data: undefined };
      });

    const first = await readOrHydrate({
      ...createDeps(),
      virtualFile,
      filePath: '/tmp/cache-file',
      range: { position: 0, length: 10 },
    });
    const state = getExistingHydrationState(virtualFile.contentsId);

    expect(first.error).toBeInstanceOf(FuseIOError);
    expect(state?.hydratedBytes).toBe(0);
    expect(state?.blocksBeingDownloaded.size).toBe(0);

    const second = await readOrHydrate({
      ...createDeps(),
      virtualFile,
      filePath: '/tmp/cache-file',
      range: { position: 0, length: 10 },
    });

    expect(second.data).toStrictEqual(Buffer.from('data'));
    expect(downloadAndCacheBlockMock).toHaveBeenCalledTimes(2);
    expect(state?.hydratedBytes).toBe(virtualFile.size);
  });

  it('does not mark aborted block downloads as hydrated and clears the in-flight entry', async () => {
    downloadAndCacheBlockMock.mockImplementation(async ({ state }) => {
      state.abortController.abort();
      return { data: undefined };
    });

    const result = await readOrHydrate({
      ...createDeps(),
      virtualFile,
      filePath: '/tmp/cache-file',
      range: { position: 0, length: 10 },
    });
    const state = getExistingHydrationState(virtualFile.contentsId);

    expect(result.data).toStrictEqual(Buffer.alloc(0));
    expect(state?.hydratedBytes).toBe(0);
    expect(state?.blocksBeingDownloaded.size).toBe(0);
  });

  it('does not finalize partially hydrated files', async () => {
    const partialFile = { ...virtualFile, size: BLOCK_SIZE + 100 } as unknown as File;
    const deps = createDeps();
    const state = getOrCreateHydrationState(partialFile.contentsId, partialFile.size);
    markBlocksInRangeDownloaded(state, { position: 0, length: BLOCK_SIZE });

    const result = await readOrHydrate({
      ...deps,
      virtualFile: partialFile,
      filePath: '/tmp/cache-file',
      range: { position: 0, length: 10 },
    });

    expect(result.data).toStrictEqual(Buffer.from('data'));
    expect(deps.saveToRepository).not.toHaveBeenCalled();
    expect(state.finalized).toBe(false);
  });

  it('treats empty files as already hydrated and finalizes without downloading blocks', async () => {
    const emptyFile = { ...virtualFile, contentsId: 'empty-contents-id', size: 0 } as unknown as File;
    const deps = createDeps();
    readChunkFromDiskMock.mockResolvedValue(Buffer.alloc(0));

    const result = await readOrHydrate({
      ...deps,
      virtualFile: emptyFile,
      filePath: '/tmp/cache-file',
      range: { position: 0, length: 0 },
    });
    const state = getExistingHydrationState(emptyFile.contentsId);

    expect(result.data).toStrictEqual(Buffer.alloc(0));
    expect(downloadAndCacheBlockMock).not.toHaveBeenCalled();
    expect(deps.saveToRepository).toHaveBeenCalledOnce();
    expect(state?.hydratedBytes).toBe(0);
    expect(state?.finalized).toBe(true);
  });

  it('finalizes fully hydrated files', async () => {
    const deps = createDeps();
    const state = getOrCreateHydrationState(virtualFile.contentsId, virtualFile.size);
    markBlocksInRangeDownloaded(state, { position: 0, length: virtualFile.size });

    const result = await readOrHydrate({
      ...deps,
      virtualFile,
      filePath: '/tmp/cache-file',
      range: { position: 0, length: 10 },
    });

    expect(result.data).toStrictEqual(Buffer.from('data'));
    expect(deps.saveToRepository).toHaveBeenCalledOnce();
    expect(deps.saveToRepository).toHaveBeenCalledWith(
      virtualFile.contentsId,
      virtualFile.size,
      virtualFile.uuid,
      virtualFile.name,
      virtualFile.type,
    );
    expect(state.finalized).toBe(true);
  });

  it('registers once for concurrent full-hydration reads and shares in-flight finalization', async () => {
    let resolveRegistration: () => void = () => undefined;
    const saveToRepository = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveRegistration = resolve;
        }),
    );
    const deps = createDeps({ saveToRepository });
    const state = getOrCreateHydrationState(virtualFile.contentsId, virtualFile.size);
    markBlocksInRangeDownloaded(state, { position: 0, length: virtualFile.size });

    const first = readOrHydrate({
      ...deps,
      virtualFile,
      filePath: '/tmp/cache-file',
      range: { position: 0, length: 10 },
    });
    const second = readOrHydrate({
      ...deps,
      virtualFile,
      filePath: '/tmp/cache-file',
      range: { position: 5, length: 10 },
    });

    await testSleep(0);
    expect(saveToRepository).toHaveBeenCalledOnce();
    expect(state.finalization).toBeDefined();
    expect(state.finalized).toBe(false);

    resolveRegistration();

    await expect(first).resolves.toHaveProperty('data', Buffer.from('data'));
    await expect(second).resolves.toHaveProperty('data', Buffer.from('data'));
    expect(state.finalization).toBeUndefined();
    expect(state.finalized).toBe(true);
  });

  it('allows failed finalization to be retried by a later normal read', async () => {
    const saveToRepository = vi
      .fn()
      .mockRejectedValueOnce(new Error('register failed'))
      .mockResolvedValueOnce(undefined);
    const deps = createDeps({ saveToRepository });
    const state = getOrCreateHydrationState(virtualFile.contentsId, virtualFile.size);
    markBlocksInRangeDownloaded(state, { position: 0, length: virtualFile.size });

    const first = await readOrHydrate({
      ...deps,
      virtualFile,
      filePath: '/tmp/cache-file',
      range: { position: 0, length: 10 },
    });

    expect(first.error).toBeInstanceOf(FuseIOError);
    expect(first.error?.message).toContain('register failed');
    expect(state.finalization).toBeUndefined();
    expect(state.finalized).toBe(false);

    const second = await readOrHydrate({
      ...deps,
      virtualFile,
      filePath: '/tmp/cache-file',
      range: { position: 0, length: 10 },
    });

    expect(second.data).toStrictEqual(Buffer.from('data'));
    expect(saveToRepository).toHaveBeenCalledTimes(2);
    expect(state.finalized).toBe(true);
  });

  it('fires downloadFinished once after successful finalization', async () => {
    const downloadFinished = vi.fn();
    const saveToRepository = vi.fn().mockImplementation(async () => {
      downloadFinished();
    });
    const deps = createDeps({ saveToRepository });
    const state = getOrCreateHydrationState(virtualFile.contentsId, virtualFile.size);
    markBlocksInRangeDownloaded(state, { position: 0, length: virtualFile.size });

    await readOrHydrate({
      ...deps,
      virtualFile,
      filePath: '/tmp/cache-file',
      range: { position: 0, length: 10 },
    });
    await readOrHydrate({
      ...deps,
      virtualFile,
      filePath: '/tmp/cache-file',
      range: { position: 0, length: 10 },
    });

    expect(saveToRepository).toHaveBeenCalledOnce();
    expect(downloadFinished).toHaveBeenCalledOnce();
  });
});
