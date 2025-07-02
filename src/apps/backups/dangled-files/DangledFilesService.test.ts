import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockDeep, DeepMockProxy, MockProxy } from 'vitest-mock-extended';
import { DangledFilesService } from './DangledFilesService';
import { EnvironmentRemoteFileContentsManagersFactory } from '@/context/virtual-drive/contents/infrastructure/EnvironmentRemoteFileContentsManagersFactory';
import { File } from '@/context/virtual-drive/files/domain/File';
import { LocalFile } from '@/context/local/localFile/domain/LocalFile';
import { Readable } from 'stream';
import { EnvironmentContentFileDownloader } from '@/context/virtual-drive/contents/infrastructure/download/EnvironmentContentFileDownloader';

describe('DangledFilesService', () => {
  let service: DangledFilesService;
  let contentsManagerFactory: DeepMockProxy<EnvironmentRemoteFileContentsManagersFactory>;
  let downloader: MockProxy<EnvironmentContentFileDownloader>;

  beforeEach(() => {
    vi.clearAllMocks();
    contentsManagerFactory = mockDeep<EnvironmentRemoteFileContentsManagersFactory>();
    downloader = mockDeep<EnvironmentContentFileDownloader>();
    downloader.download.mockResolvedValue(new Readable());
    contentsManagerFactory.downloader.mockReturnValue(downloader);
    service = new DangledFilesService(contentsManagerFactory);
  });

  describe('isFileDownloadable', () => {
    const file = { contentsId: 'cid', name: 'fileName' } as File;

    it('should resolve true when downloader emits start', async () => {
      let startCallback: () => void;
      downloader.on.mockImplementation((event, cb) => {
        if (event === 'start') startCallback = cb as () => void;
      });

      downloader.download.mockImplementation(() => {
        startCallback();
        return Promise.resolve(new Readable());
      });

      const result = await service.isFileDownloadable(file);
      expect(result).toBe(true);
    });

    it('should resolve true when downloader emits progress and forceStop is called', async () => {
      let progressCallback: () => void;
      downloader.on.mockImplementation((event, cb) => {
        if (event === 'progress') progressCallback = cb as () => void;
      });

      downloader.download.mockImplementation(() => {
        progressCallback();
        return Promise.resolve(new Readable());
      });

      const result = await service.isFileDownloadable(file);
      expect(downloader.forceStop).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should resolve false when downloader emits error', async () => {
      let errorCallback: (err: Error) => void;
      downloader.on.mockImplementation((event, cb) => {
        if (event === 'error') errorCallback = cb as (err: Error) => void;
      });

      downloader.download.mockImplementation(() => {
        errorCallback(new Error('download failed'));
        return Promise.resolve(new Readable());
      });

      const result = await service.isFileDownloadable(file);
      expect(result).toBe(false);
    });

    it('should return false if download throws', async () => {
      downloader.download.mockRejectedValueOnce(new Error('unexpected error'));

      const result = await service.isFileDownloadable(file);
      expect(result).toBe(false);
    });
  });

  describe('handleDangledFile', () => {
    it('should add non-downloadable files to the resync map', async () => {
      const local1 = {} as LocalFile;
      const remote1 = { contentsId: 'id1', name: 'n1' } as File;
      const local2 = {} as LocalFile;
      const remote2 = { contentsId: 'id2', name: 'n2' } as File;
      const danglings = new Map<LocalFile, File>([
        [local1, remote1],
        [local2, remote2],
      ]);
      vi.spyOn(service, 'isFileDownloadable').mockResolvedValueOnce(false).mockResolvedValueOnce(true);

      const result = await service.handleDangledFile(danglings);
      expect(result.size).toBe(1);
      expect(result.get(local1)).toBe(remote1);
      expect(result.has(local2)).toBe(false);
    });

    it('should ignore undefined remoteFile entries', async () => {
      const local = {} as LocalFile;
      const danglings = new Map<LocalFile, File | undefined>([[local, undefined]]);

      const result = await service.handleDangledFile(danglings as Map<LocalFile, File>);
      expect(result.size).toBe(0);
    });

    it('should continue on isFileDownloadable errors', async () => {
      const local = {} as LocalFile;
      const remote = { contentsId: 'id', name: 'n' } as File;
      const danglings = new Map<LocalFile, File>([[local, remote]]);
      vi.spyOn(service, 'isFileDownloadable').mockRejectedValueOnce(new Error('fail'));

      const result = await service.handleDangledFile(danglings);
      expect(result.size).toBe(0);
    });

    it('should handle multiple mixed outcomes correctly', async () => {
      const l1 = {} as LocalFile;
      const r1 = { contentsId: 'c1', name: 'n1' } as File;
      const l2 = {} as LocalFile;
      const r2 = { contentsId: 'c2', name: 'n2' } as File;
      const l3 = {} as LocalFile;
      const r3 = { contentsId: 'c3', name: 'n3' } as File;
      const danglings = new Map<LocalFile, File>([
        [l1, r1],
        [l2, r2],
        [l3, r3],
      ]);
      vi.spyOn(service, 'isFileDownloadable')
        .mockResolvedValueOnce(false)
        .mockResolvedValueOnce(true)
        .mockRejectedValueOnce(new Error('err'));

      const result = await service.handleDangledFile(danglings);
      expect(result.size).toBe(1);
      expect(result.get(l1)).toBe(r1);
      expect(result.has(l2)).toBe(false);
      expect(result.has(l3)).toBe(false);
    });
  });
});
