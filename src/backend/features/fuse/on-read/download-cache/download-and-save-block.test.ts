import { type File } from '../../../../../context/virtual-drive/files/domain/File';
import { downloadFileRange } from '../../../../../infra/environment/download-file/download-file';
import { writeChunkToDisk } from '../read-chunk-from-disk';
import { BLOCK_SIZE } from './constants';
import { downloadAndCacheBlock } from './download-and-save-block';
import {
  clearHydrationState,
  getOrCreateHydrationState,
  isRangeHydrated,
  markBlocksInRangeDownloaded,
  type FileHydrationState,
} from './hydration-state';

vi.mock('../../../../../infra/environment/download-file/download-file', () => ({
  downloadFileRange: vi.fn(),
}));

vi.mock('../read-chunk-from-disk', () => ({
  writeChunkToDisk: vi.fn(),
}));

const downloadFileRangeMock = vi.mocked(downloadFileRange);
const writeChunkToDiskMock = vi.mocked(writeChunkToDisk);

const virtualFile = {
  contentsId: 'contents-id',
  name: 'video',
  nameWithExtension: 'video.mp4',
  type: 'mp4',
  uuid: 'uuid',
  size: 1024,
} as unknown as File;

function createState(): FileHydrationState {
  return getOrCreateHydrationState(virtualFile.contentsId, virtualFile.size);
}

function createVirtualFile(overrides: Partial<File> = {}): File {
  return {
    ...virtualFile,
    ...overrides,
  } as File;
}

function createProps(overrides: Partial<Parameters<typeof downloadAndCacheBlock>[0]> = {}) {
  return {
    bucketId: 'bucket-id',
    mnemonic: 'mnemonic',
    network: {} as Parameters<typeof downloadAndCacheBlock>[0]['network'],
    onDownloadProgress: vi.fn(),
    virtualFile,
    filePath: '/tmp/cache-file',
    state: createState(),
    blockStart: 100,
    blockLength: 50,
    ...overrides,
  };
}

describe('downloadAndCacheBlock', () => {
  beforeEach(() => {
    clearHydrationState();
    downloadFileRangeMock.mockResolvedValue({ data: Buffer.from('downloaded') });
    writeChunkToDiskMock.mockResolvedValue(undefined);
  });

  it('downloads the requested range and writes it to the cache file offset', async () => {
    const props = createProps();

    await downloadAndCacheBlock(props);

    expect(downloadFileRangeMock).toHaveBeenCalledWith({
      fileId: virtualFile.contentsId,
      bucketId: props.bucketId,
      mnemonic: props.mnemonic,
      network: props.network,
      range: { position: props.blockStart, length: props.blockLength },
      signal: props.state.abortController.signal,
    });
    expect(writeChunkToDiskMock).toHaveBeenCalledWith('/tmp/cache-file', Buffer.from('downloaded'), 100);
  });

  it('marks the block hydrated only after download and disk write succeed', async () => {
    const props = createProps();

    await downloadAndCacheBlock(props);

    expect(isRangeHydrated(props.state, { position: props.blockStart, length: props.blockLength })).toBe(true);
  });

  it('emits progress from hydrated bytes after the block is written and marked hydrated', async () => {
    const onDownloadProgress = vi.fn();
    const hydratedFile = createVirtualFile({ contentsId: 'first-block-file', size: BLOCK_SIZE * 2 });
    const state = getOrCreateHydrationState(hydratedFile.contentsId, hydratedFile.size);
    state.stopwatch = { elapsedTime: vi.fn(() => 123) } as unknown as FileHydrationState['stopwatch'];

    await downloadAndCacheBlock(
      createProps({
        state,
        onDownloadProgress,
        virtualFile: hydratedFile,
        blockStart: 0,
        blockLength: BLOCK_SIZE,
      }),
    );

    expect(onDownloadProgress).toHaveBeenCalledWith('video', 'mp4', BLOCK_SIZE, hydratedFile.size, 123);
  });

  it('does not report full progress for a random EOF block when earlier blocks are missing', async () => {
    const onDownloadProgress = vi.fn();
    const eofFile = createVirtualFile({ contentsId: 'eof-file', size: BLOCK_SIZE * 3 + 123 });
    const state = getOrCreateHydrationState(eofFile.contentsId, eofFile.size);

    await downloadAndCacheBlock(
      createProps({
        state,
        onDownloadProgress,
        virtualFile: eofFile,
        blockStart: BLOCK_SIZE * 3,
        blockLength: 123,
      }),
    );

    expect(onDownloadProgress).toHaveBeenCalledWith('video', 'mp4', 123, eofFile.size, 0);
  });

  it('counts the final block by its actual length', async () => {
    const onDownloadProgress = vi.fn();
    const fileWithPartialFinalBlock = createVirtualFile({
      contentsId: 'partial-final-block-file',
      size: BLOCK_SIZE + 123,
    });
    const state = getOrCreateHydrationState(fileWithPartialFinalBlock.contentsId, fileWithPartialFinalBlock.size);

    await downloadAndCacheBlock(
      createProps({
        state,
        onDownloadProgress,
        virtualFile: fileWithPartialFinalBlock,
        blockStart: BLOCK_SIZE,
        blockLength: 123,
      }),
    );

    expect(onDownloadProgress).toHaveBeenCalledWith('video', 'mp4', 123, fileWithPartialFinalBlock.size, 0);
  });

  it('reports 100% progress when every block is hydrated', async () => {
    const onDownloadProgress = vi.fn();
    const fullyHydratedFile = createVirtualFile({ contentsId: 'fully-hydrated-file', size: BLOCK_SIZE + 123 });
    const state = getOrCreateHydrationState(fullyHydratedFile.contentsId, fullyHydratedFile.size);
    markBlocksInRangeDownloaded(state, { position: 0, length: BLOCK_SIZE });

    await downloadAndCacheBlock(
      createProps({
        state,
        onDownloadProgress,
        virtualFile: fullyHydratedFile,
        blockStart: BLOCK_SIZE,
        blockLength: 123,
      }),
    );

    expect(onDownloadProgress).toHaveBeenCalledWith('video', 'mp4', fullyHydratedFile.size, fullyHydratedFile.size, 0);
  });

  it('does not write, mark hydrated, or emit progress when the range download fails', async () => {
    const props = createProps();
    downloadFileRangeMock.mockResolvedValue({ error: new Error('network failed') });

    await expect(downloadAndCacheBlock(props)).resolves.toStrictEqual({ error: new Error('network failed') });

    expect(writeChunkToDiskMock).not.toHaveBeenCalled();
    expect(isRangeHydrated(props.state, { position: props.blockStart, length: props.blockLength })).toBe(false);
    expect(props.onDownloadProgress).not.toHaveBeenCalled();
  });

  it('does not mark hydrated or emit progress when the disk write fails', async () => {
    const props = createProps();
    writeChunkToDiskMock.mockRejectedValue(new Error('write failed'));

    await expect(downloadAndCacheBlock(props)).resolves.toStrictEqual({ error: new Error('write failed') });

    expect(isRangeHydrated(props.state, { position: props.blockStart, length: props.blockLength })).toBe(false);
    expect(props.onDownloadProgress).not.toHaveBeenCalled();
  });

  it('does not start a download when hydration is already aborted', async () => {
    const props = createProps();
    props.state.abortController.abort();

    await expect(downloadAndCacheBlock(props)).resolves.toStrictEqual({ data: undefined });

    expect(downloadFileRangeMock).not.toHaveBeenCalled();
    expect(writeChunkToDiskMock).not.toHaveBeenCalled();
    expect(isRangeHydrated(props.state, { position: props.blockStart, length: props.blockLength })).toBe(false);
    expect(props.onDownloadProgress).not.toHaveBeenCalled();
  });

  it('does not write, mark hydrated, or emit progress when hydration aborts after download', async () => {
    const props = createProps();
    downloadFileRangeMock.mockImplementation(async () => {
      props.state.abortController.abort();
      return { data: Buffer.from('downloaded') };
    });

    await expect(downloadAndCacheBlock(props)).resolves.toStrictEqual({ data: undefined });

    expect(writeChunkToDiskMock).not.toHaveBeenCalled();
    expect(isRangeHydrated(props.state, { position: props.blockStart, length: props.blockLength })).toBe(false);
    expect(props.onDownloadProgress).not.toHaveBeenCalled();
  });
});
