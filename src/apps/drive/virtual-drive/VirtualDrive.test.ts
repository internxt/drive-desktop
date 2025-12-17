import { VirtualDrive } from './VirtualDrive';

import { ContainerMock } from '../__mocks__/ContainerMock';
import { StorageFileIsAvailableOffline } from '../../../context/storage/StorageFiles/application/offline/StorageFileIsAvailableOffline';
import { AllFilesInFolderAreAvailableOffline } from '../../../context/storage/StorageFolders/application/offline/AllFilesInFolderAreAvailableOffline';
import { TemporalFileByPathFinder } from '../../../context/storage/TemporalFiles/application/find/TemporalFileByPathFinder';
import { CacheStorageFile } from '../../../context/storage/StorageFiles/application/offline/CacheStorageFile';

describe('VirtualDrive', () => {
  let container: ContainerMock;
  let virtualDrive: VirtualDrive;
  let path = '/path/to/file.txt';

  beforeEach(() => {
    container = new ContainerMock();
    virtualDrive = new VirtualDrive(container);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should make a file locally available given a path', async () => {
    const cacheStorageFileMock = { run: vi.fn() };

    container.set(CacheStorageFile, cacheStorageFileMock);

    await virtualDrive.makeFileLocallyAvailable(path);

    expect(container.get).toHaveBeenCalledWith(CacheStorageFile);
    expect(cacheStorageFileMock.run).toHaveBeenCalledWith(path);
  });

  describe('isLocallyAvailable', () => {
    it('should verify if a file is locally available', async () => {
      const storageFileIsAvailableOfflineMock = { run: vi.fn().mockResolvedValue(true) };
      container.set(StorageFileIsAvailableOffline, storageFileIsAvailableOfflineMock);

      const result = await virtualDrive.isLocallyAvailable(path);

      expect(container.get).toHaveBeenCalledWith(StorageFileIsAvailableOffline);
      expect(storageFileIsAvailableOfflineMock.run).toHaveBeenCalledWith(path);
      expect(result).toBe(true);
    });

    it('Should verify if a folder is available locally', async () => {
      path = '/path/to/folder';
      const allFilesInFolderAreAvailableOfflineMock = { run: vi.fn().mockResolvedValue(true) };
      container.set(AllFilesInFolderAreAvailableOffline, allFilesInFolderAreAvailableOfflineMock);

      const result = await virtualDrive.isLocallyAvailable(path);

      expect(container.get).toHaveBeenCalledWith(AllFilesInFolderAreAvailableOffline);
      expect(allFilesInFolderAreAvailableOfflineMock.run).toHaveBeenCalledWith(path);
      expect(result).toBe(true);
    });
  });

  it('should verify if a temporal file exists', async () => {
    const temporalFileMock = { run: vi.fn().mockResolvedValue(true) };
    container.set(TemporalFileByPathFinder, temporalFileMock);

    const result = await virtualDrive.temporalFileExists(path);

    expect(container.get).toHaveBeenCalledWith(TemporalFileByPathFinder);
    expect(temporalFileMock.run).toHaveBeenCalledWith(path);
    expect(result.getRight()).toEqual(true);
  });

  it('should return false if a temporal file doesnt exist', async () => {
    const temporalFileMock = { run: vi.fn().mockResolvedValue(null) };
    container.set(TemporalFileByPathFinder, temporalFileMock);

    const result = await virtualDrive.temporalFileExists(path);

    expect(container.get).toHaveBeenCalledWith(TemporalFileByPathFinder);
    expect(temporalFileMock.run).toHaveBeenCalledWith(path);
    expect(result.getRight()).toEqual(false);
  });
});
