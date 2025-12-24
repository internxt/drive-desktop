import { StorageFileIsAvailableOffline } from './StorageFileIsAvailableOffline';
import { SingleFileMatchingFinderTestClass } from '../../../../virtual-drive/files/__test-helpers__/SingleFileMatchingFinderTestClass';
import { StorageFilesRepositoryMock } from '../../__mocks__/StorageFilesRepositoryMock';
import { FileMother } from '../../../../virtual-drive/files/domain/__test-helpers__/FileMother';
import { StorageFileId } from '../../domain/StorageFileId';
import { FileStatuses } from '../../../../virtual-drive/files/domain/FileStatus';

describe('StorageFileIsAvailableOffline', () => {
  let sut: StorageFileIsAvailableOffline;
  let virtualFileFinder: SingleFileMatchingFinderTestClass;
  let repository: StorageFilesRepositoryMock;

  beforeEach(() => {
    virtualFileFinder = new SingleFileMatchingFinderTestClass();
    repository = new StorageFilesRepositoryMock();

    sut = new StorageFileIsAvailableOffline(virtualFileFinder, repository);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('run', () => {
    it('should return true for files with size 0 without checking the repository', async () => {
      const file = FileMother.fromPartial({ size: 0, path: '/test/empty-file.txt' });
      virtualFileFinder.finds(file);

      const result = await sut.run(file.path);

      expect(result).toBe(true);
      expect(virtualFileFinder['mock']).toBeCalledWith({
        path: file.path,
        status: FileStatuses.EXISTS,
      });
      expect(repository['existsMock']).not.toBeCalled();
    });

    it('should return false when file does not exist in repository', async () => {
      const file = FileMother.fromPartial({ size: 2048, path: '/test/large-file.txt' });
      virtualFileFinder.finds(file);
      repository.shouldExists([{ id: new StorageFileId(file.contentsId), value: false }]);

      const result = await sut.run(file.path);

      expect(result).toBe(false);
      expect(virtualFileFinder['mock']).toBeCalledWith({
        path: file.path,
        status: FileStatuses.EXISTS,
      });
      expect(repository['existsMock']).toBeCalledWith(new StorageFileId(file.contentsId));
    });

    it('should return true when file exist in repository', async () => {
      const file = FileMother.fromPartial({ size: 1024, path: '/test/file.txt' });
      virtualFileFinder.finds(file);
      repository.shouldExists([{ id: new StorageFileId(file.contentsId), value: true }]);

      const result = await sut.run(file.path);

      expect(result).toBe(true);
      expect(virtualFileFinder['mock']).toBeCalledWith({
        path: file.path,
        status: FileStatuses.EXISTS,
      });
      expect(repository['existsMock']).toBeCalledWith(new StorageFileId(file.contentsId));
    });
  });
});
