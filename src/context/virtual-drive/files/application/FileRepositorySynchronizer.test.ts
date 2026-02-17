import { FileRepositorySynchronizer } from './FileRepositorySynchronizer';
import { FileRepository } from '../domain/FileRepository';
import { right } from '../../../shared/domain/Either';
import { File } from '../domain/File';
import { StorageFileService } from '../../../storage/StorageFiles/StorageFileService';
import { Mocked } from 'vitest';
import * as deleteFileFromTrashModule from '../../../../infra/drive-server/services/files/services/delete-file-from-trash';
import { call, calls, partialSpyOn } from '../../../../../tests/vitest/utils.helper';

// Mock the Environment module
vi.mock('@internxt/inxt-js', () => ({
  Environment: {
    get: vi.fn(),
  },
}));

describe('FileRepositorySynchronizer', () => {
  let sut: FileRepositorySynchronizer;
  let fileRepositoryMock: Mocked<FileRepository>;
  let storageFileServiceMock: Mocked<StorageFileService>;
  const deleteFileFromTrashMock = partialSpyOn(deleteFileFromTrashModule, 'deleteFileFromTrash');

  beforeEach(() => {
    fileRepositoryMock = {
      searchByArrayOfContentsId: vi.fn(),
      clear: vi.fn(),
      upsert: vi.fn(),
    } as unknown as Mocked<FileRepository>;

    storageFileServiceMock = {
      isFileDownloadable: vi.fn(),
    } as unknown as Mocked<StorageFileService>;

    sut = new FileRepositorySynchronizer(fileRepositoryMock, storageFileServiceMock);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('fixDanglingFiles', () => {
    it('should not continue with the execution if there are no files in memory repository given the array of contentsIds', async () => {
      fileRepositoryMock.searchByArrayOfContentsId.mockResolvedValue([]);

      const result = await sut.fixDanglingFiles(['file1', 'file2']);

      expect(fileRepositoryMock.searchByArrayOfContentsId).toHaveBeenCalledWith(['file1', 'file2']);
      expect(storageFileServiceMock.isFileDownloadable).not.toBeCalled();
      expect(deleteFileFromTrashMock).not.toBeCalled();
      expect(result).toBe(true);
    });
    it('should check every found file if is downloadable and call deleteFileFromTrash', async () => {
      const files = [{ contentsId: 'file1' }, { contentsId: 'file2' }] as unknown as File[];

      fileRepositoryMock.searchByArrayOfContentsId.mockResolvedValue(files);
      storageFileServiceMock.isFileDownloadable
        .mockResolvedValueOnce(right(false)) // File1 is NOT downloadable
        .mockResolvedValueOnce(right(true)); // File2 is downloadable

      deleteFileFromTrashMock.mockResolvedValueOnce({ data: true });

      const result = await sut.fixDanglingFiles(['file1', 'file2']);

      expect(storageFileServiceMock.isFileDownloadable).toHaveBeenCalledTimes(2);
      calls(deleteFileFromTrashMock).toHaveLength(1);
      call(deleteFileFromTrashMock).toStrictEqual('file1');
      expect(result).toBe(true);
    });
    it('should return false if there is an error trying to retrieve files', async () => {
      fileRepositoryMock.searchByArrayOfContentsId.mockRejectedValue(new Error('Test failure'));

      const result = await sut.fixDanglingFiles(['file1', 'file2']);
      expect(result).toBe(false);
    });
    it('should return true if not a single error was found while checking all of the files', async () => {
      const files = [{ contentsId: 'file1' }, { contentsId: 'file2' }] as unknown as File[];

      fileRepositoryMock.searchByArrayOfContentsId.mockResolvedValue(files);
      storageFileServiceMock.isFileDownloadable.mockResolvedValue(right(true)); // Both files are downloadable

      const result = await sut.fixDanglingFiles(['file1', 'file2']);

      calls(storageFileServiceMock.isFileDownloadable).toHaveLength(2);
      expect(deleteFileFromTrashMock).not.toBeCalled();
      expect(result).toBe(true);
    });

    it('should skip files with size 0', async () => {
      const files = [
        { contentsId: 'file1', size: 0 },
        { contentsId: 'file2', size: 100 },
        { contentsId: 'file3', size: 0 },
      ] as unknown as File[];

      fileRepositoryMock.searchByArrayOfContentsId.mockResolvedValue(files);
      storageFileServiceMock.isFileDownloadable.mockResolvedValue(right(true));

      const result = await sut.fixDanglingFiles(['file1', 'file2', 'file3']);

      expect(storageFileServiceMock.isFileDownloadable).toHaveBeenCalledTimes(1);
      call(storageFileServiceMock.isFileDownloadable).toStrictEqual('file2');
      expect(deleteFileFromTrashMock).not.toHaveBeenCalled();
      expect(result).toBe(true);
    });
  });
});
