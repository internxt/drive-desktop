import { handleReadCallback, type HandleReadCallbackProps } from './handle-read-callback';
import * as readChunkModule from './read-chunk-from-disk';
import * as processBlocklistModule from '../../../features/virtual-drive/utils/process-blocklist';
import * as fileExistsModule from './download-cache/file-exists-on-disk';
import * as allocateFileModule from './download-cache/allocate-file';
import * as downloadAndSaveBlockModule from './download-cache/download-and-save-block';
import * as downloadFileModule from '../../../../infra/environment/download-file/download-file';
import {
  clearHydrationState,
  getExistingHydrationState,
  getOrCreateHydrationState,
  markBlocksInRangeDownloaded,
} from './download-cache/hydration-state';
import { partialSpyOn, call } from '../../../../../tests/vitest/utils.helper';
import { type File } from '../../../../context/virtual-drive/files/domain/File';
import { FuseIOError, FuseNoSuchFileOrDirectoryError } from '../../../../apps/drive/fuse/callbacks/FuseErrors';

const readChunkFromDiskMock = partialSpyOn(readChunkModule, 'readChunkFromDisk');
const isBlocklistedProcessMock = partialSpyOn(processBlocklistModule, 'isBlocklistedProcess');
const fileExistsOnDiskMock = partialSpyOn(fileExistsModule, 'fileExistsOnDisk');
const allocateFileMock = partialSpyOn(allocateFileModule, 'allocateFile');
const downloadAndCacheBlockMock = partialSpyOn(downloadAndSaveBlockModule, 'downloadAndCacheBlock');
const downloadFileRangeMock = partialSpyOn(downloadFileModule, 'downloadFileRange');

const virtualFile = {
  contentsId: 'contents-123',
  name: 'video.mp4',
  nameWithExtension: 'video.mp4',
  type: 'mp4',
  uuid: 'uuid-123',
  size: 1000,
} as unknown as File;

function createDeps(overrides: Partial<HandleReadCallbackProps> = {}): HandleReadCallbackProps {
  return {
    findVirtualFile: vi.fn().mockResolvedValue(virtualFile),
    findTemporalFile: vi.fn().mockResolvedValue(undefined),
    onDownloadProgress: vi.fn(),
    saveToRepository: vi.fn().mockResolvedValue(undefined),
    bucketId: 'bucket-id',
    mnemonic: 'mnemonic',
    network: {} as HandleReadCallbackProps['network'],
    path: '/file.mp4',
    range: { position: 0, length: 10 },
    processName: 'vlc',
    ...overrides,
  };
}

describe('handleReadCallback', () => {
  beforeEach(() => {
    clearHydrationState();
    vi.clearAllMocks();
    isBlocklistedProcessMock.mockReturnValue(false);
    fileExistsOnDiskMock.mockResolvedValue(true);
    allocateFileMock.mockResolvedValue(undefined);
    downloadAndCacheBlockMock.mockResolvedValue({ data: undefined });
    readChunkFromDiskMock.mockResolvedValue(Buffer.from('data'));
  });

  describe('when virtual file is not found', () => {
    it('should return ENOENT when neither virtual nor temporal file exists', async () => {
      const deps = createDeps({
        findVirtualFile: vi.fn().mockResolvedValue(undefined),
        findTemporalFile: vi.fn().mockResolvedValue(undefined),
      });

      const result = await handleReadCallback({ ...deps, path: '/file.txt' });

      expect(result.error).toBeInstanceOf(FuseNoSuchFileOrDirectoryError);
    });

    it('should read from temporal file when virtual file is not found but temporal exists', async () => {
      const chunk = Buffer.from('temporal-data');
      readChunkFromDiskMock.mockResolvedValue(chunk);
      const deps = createDeps({
        findVirtualFile: vi.fn().mockResolvedValue(undefined),
        findTemporalFile: vi.fn().mockResolvedValue({
          path: { value: '/virtual/file.txt' },
          contentFilePath: '/tmp/internxt-drive-tmp/uuid',
        }),
      });

      const result = await handleReadCallback({ ...deps, path: '/file.txt', range: { position: 0, length: 13 } });

      expect(result.data).toBe(chunk);
      call(readChunkFromDiskMock).toStrictEqual(['/tmp/internxt-drive-tmp/uuid', 13, 0]);
    });

    it('should return ENOENT when temporal file has no content path', async () => {
      const deps = createDeps({
        findVirtualFile: vi.fn().mockResolvedValue(undefined),
        findTemporalFile: vi.fn().mockResolvedValue({ path: { value: '/virtual/file.txt' } }),
      });

      const result = await handleReadCallback({ ...deps, path: '/file.txt' });

      expect(result.error).toBeInstanceOf(FuseNoSuchFileOrDirectoryError);
    });
  });

  describe.skip('when process is blocklisted', () => {
    it('should return empty buffer without side effects when the requested range is not cached', async () => {
      isBlocklistedProcessMock.mockReturnValue(true);
      fileExistsOnDiskMock.mockResolvedValue(false);
      const deps = createDeps({ processName: 'pool-org.gnome.' });

      const result = await handleReadCallback(deps);

      expect(result.data).toHaveLength(0);
      expect(getExistingHydrationState(virtualFile.contentsId)).toBeUndefined();
      expect(fileExistsOnDiskMock).not.toHaveBeenCalled();
      expect(allocateFileMock).not.toHaveBeenCalled();
      expect(downloadAndCacheBlockMock).not.toHaveBeenCalled();
      expect(deps.onDownloadProgress).not.toHaveBeenCalled();
      expect(deps.saveToRepository).not.toHaveBeenCalled();
      expect(readChunkFromDiskMock).not.toHaveBeenCalled();
    });

    it('should return empty buffer when hydration state exists but the requested range is not cached', async () => {
      isBlocklistedProcessMock.mockReturnValue(true);
      getOrCreateHydrationState(virtualFile.contentsId, virtualFile.size);
      const deps = createDeps({ processName: 'pool-org.gnome.' });

      const result = await handleReadCallback(deps);

      expect(result.data).toHaveLength(0);
      expect(allocateFileMock).not.toHaveBeenCalled();
      expect(readChunkFromDiskMock).not.toHaveBeenCalled();
      expect(downloadAndCacheBlockMock).not.toHaveBeenCalled();
      expect(deps.onDownloadProgress).not.toHaveBeenCalled();
      expect(deps.saveToRepository).not.toHaveBeenCalled();
    });

    it('should return requested bytes when the range is already cached', async () => {
      isBlocklistedProcessMock.mockReturnValue(true);
      const state = getOrCreateHydrationState(virtualFile.contentsId, virtualFile.size);
      markBlocksInRangeDownloaded(state, { position: 0, length: 10 });
      const cached = Buffer.from('cached');
      readChunkFromDiskMock.mockResolvedValue(cached);
      const deps = createDeps({ processName: 'pool-org.gnome.' });

      const result = await handleReadCallback(deps);

      expect(result.data).toBe(cached);
      expect(fileExistsOnDiskMock).not.toHaveBeenCalled();
      expect(allocateFileMock).not.toHaveBeenCalled();
      expect(downloadAndCacheBlockMock).not.toHaveBeenCalled();
      expect(deps.onDownloadProgress).not.toHaveBeenCalled();
      expect(deps.saveToRepository).not.toHaveBeenCalled();
      expect(readChunkFromDiskMock).toHaveBeenCalledWith(expect.stringContaining(virtualFile.contentsId), 10, 0);
    });
  });

  describe('when process is a thumbnail generator', () => {
    it('should download the exact requested range without block expansion', async () => {
      const chunk = Buffer.from('image-header');
      downloadFileRangeMock.mockResolvedValue({ data: chunk });
      const deps = createDeps({ processName: 'pool-org.gnome.', range: { position: 0, length: 32768 } });

      const result = await handleReadCallback(deps);

      expect(result.data).toBe(chunk);
      call(downloadFileRangeMock).toMatchObject({
        fileId: virtualFile.contentsId,
        bucketId: deps.bucketId,
        mnemonic: deps.mnemonic,
        range: { position: 0, length: 32768 },
      });
    });

    it('should not allocate a cache file or download blocks', async () => {
      downloadFileRangeMock.mockResolvedValue({ data: Buffer.from('bytes') });
      const deps = createDeps({ processName: 'pool-org.gnome.' });

      await handleReadCallback(deps);

      expect(fileExistsOnDiskMock).not.toHaveBeenCalled();
      expect(allocateFileMock).not.toHaveBeenCalled();
      expect(downloadAndCacheBlockMock).not.toHaveBeenCalled();
    });

    it('should not emit download progress or register the file', async () => {
      downloadFileRangeMock.mockResolvedValue({ data: Buffer.from('bytes') });
      const deps = createDeps({ processName: 'pool-org.gnome.' });

      await handleReadCallback(deps);

      expect(deps.onDownloadProgress).not.toHaveBeenCalled();
      expect(deps.saveToRepository).not.toHaveBeenCalled();
    });

    it('should return EIO when the ranged download fails', async () => {
      downloadFileRangeMock.mockResolvedValue({ error: new Error('network error') });
      const deps = createDeps({ processName: 'pool-org.gnome.' });

      const result = await handleReadCallback(deps);

      expect(result.error).toBeInstanceOf(FuseIOError);
    });
  });

  describe('when allocating the cache file', () => {
    it('returns EIO and does not download when allocation fails', async () => {
      fileExistsOnDiskMock.mockResolvedValue(false);
      allocateFileMock.mockRejectedValueOnce(new Error('disk full'));
      const deps = createDeps();

      const result = await handleReadCallback(deps);

      expect(result.error).toBeInstanceOf(FuseIOError);
      expect(downloadAndCacheBlockMock).not.toHaveBeenCalled();
      expect(readChunkFromDiskMock).not.toHaveBeenCalled();
      expect(deps.onDownloadProgress).not.toHaveBeenCalled();
      expect(deps.saveToRepository).not.toHaveBeenCalled();
    });

    it('retries allocation on a later read after allocation fails', async () => {
      fileExistsOnDiskMock.mockResolvedValue(false);
      allocateFileMock.mockRejectedValueOnce(new Error('disk full')).mockResolvedValueOnce(undefined);
      const deps = createDeps();

      const first = await handleReadCallback(deps);
      const second = await handleReadCallback(deps);

      expect(first.error).toBeInstanceOf(FuseIOError);
      expect(second.data).toStrictEqual(Buffer.from('data'));
      expect(allocateFileMock).toHaveBeenCalledTimes(2);
      expect(downloadAndCacheBlockMock).toHaveBeenCalledOnce();
    });
  });

  describe('when file needs to be downloaded', () => {
    it('allocates missing cache file, downloads missing blocks, then reads from disk', async () => {
      fileExistsOnDiskMock.mockResolvedValue(false);
      const chunk = Buffer.from('downloaded');
      readChunkFromDiskMock.mockResolvedValue(chunk);
      const deps = createDeps();

      const result = await handleReadCallback(deps);

      expect(result.data).toBe(chunk);
      expect(allocateFileMock).toHaveBeenCalledWith(expect.stringContaining(virtualFile.contentsId), virtualFile.size);
      expect(downloadAndCacheBlockMock).toHaveBeenCalledOnce();
      expect(readChunkFromDiskMock).toHaveBeenCalledWith(expect.stringContaining(virtualFile.contentsId), 10, 0);
    });
  });
});
