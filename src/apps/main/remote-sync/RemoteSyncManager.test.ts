jest.mock('@sentry/electron/main', () => ({
  init: () => jest.fn(),
  captureException: () => jest.fn(),
}));

jest.mock('electron-log');
jest.mock('electron');
jest.mock('electron-store');
jest.mock('axios');
jest.mock('./RemoteSyncErrorHandler/RemoteSyncErrorHandler', () => ({
  RemoteSyncErrorHandler: jest.fn().mockImplementation(() => ({
    handleSyncError: jest.fn(),
  })),
}));
import { RemoteSyncErrorHandler } from './RemoteSyncErrorHandler/RemoteSyncErrorHandler';
import { RemoteSyncManager } from './RemoteSyncManager';
import { RemoteSyncedFile, RemoteSyncedFolder } from './helpers';
import * as uuid from 'uuid';
import axios from 'axios';
import { DatabaseCollectionAdapter } from '../database/adapters/base';
import { DriveFile } from '../database/entities/DriveFile';
import { DriveFolder } from '../database/entities/DriveFolder';

const mockedAxios = axios as jest.Mocked<typeof axios>;

const inMemorySyncedFilesCollection: DatabaseCollectionAdapter<DriveFile> = {
  get: jest.fn(),
  connect: jest.fn(),
  update: jest.fn(),
  create: jest.fn(),
  remove: jest.fn(),
  getLastUpdated: jest.fn(),
};

const inMemorySyncedFoldersCollection: DatabaseCollectionAdapter<DriveFolder> =
  {
    get: jest.fn(),
    connect: jest.fn(),
    update: jest.fn(),
    create: jest.fn(),
    remove: jest.fn(),
    getLastUpdated: jest.fn(),
  };

const createRemoteSyncedFileFixture = (
  payload: Partial<RemoteSyncedFile>
): RemoteSyncedFile => {
  const result: RemoteSyncedFile = {
    status: 'EXISTS',
    name: `name_${uuid.v4()}`,
    plainName: `plainname_${Date.now()}`,
    id: Date.now(),
    uuid: uuid.v4(),
    fileId: Date.now().toString(),
    type: 'jpg',
    size: 999,
    bucket: `bucket_${Date.now()}`,
    folderId: 555,
    folderUuid: uuid.v4(),
    userId: 567,
    modificationTime: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...payload,
  };

  return result;
};

const createRemoteSyncedFolderFixture = (
  payload: Partial<RemoteSyncedFolder>
): RemoteSyncedFolder => {
  const result: RemoteSyncedFolder = {
    name: `name_${uuid.v4()}`,
    plainName: `folder_${Date.now()}`,
    id: Date.now(),
    type: 'folder',
    bucket: `bucket_${Date.now()}`,
    userId: 567,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    parentId: null,
    uuid: uuid.v4(),
    status: 'EXISTS',
    ...payload,
  };

  return result;
};

describe('RemoteSyncManager', () => {
  let errorHandler: RemoteSyncErrorHandler;
  let sut: RemoteSyncManager;
  inMemorySyncedFilesCollection.getLastUpdated = () =>
    Promise.resolve({ success: false, result: null });
  inMemorySyncedFoldersCollection.getLastUpdated = () =>
    Promise.resolve({ success: false, result: null });

  beforeEach(() => {
    errorHandler = new RemoteSyncErrorHandler();

    sut = new RemoteSyncManager(
      {
        folders: inMemorySyncedFoldersCollection,
        files: inMemorySyncedFilesCollection,
      },
      {
        httpClient: mockedAxios,
        fetchFilesLimitPerRequest: 2,
        fetchFoldersLimitPerRequest: 2,
        syncFiles: true,
        syncFolders: true,
      },
      errorHandler
    );
    mockedAxios.get.mockClear();
  });

  describe('When there are files in remote, should sync them with local', () => {
    it('Should sync all the files', async () => {
      const sut = new RemoteSyncManager(
        {
          folders: inMemorySyncedFoldersCollection,
          files: inMemorySyncedFilesCollection,
        },
        {
          httpClient: mockedAxios,
          fetchFilesLimitPerRequest: 2,
          fetchFoldersLimitPerRequest: 2,
          syncFiles: true,
          syncFolders: false,
        },
        errorHandler
      );

      mockedAxios.get
        .mockResolvedValueOnce({
          data: [
            createRemoteSyncedFileFixture({
              plainName: 'file_1',
            }),
            createRemoteSyncedFileFixture({
              plainName: 'file_2',
            }),
          ],
        })
        .mockResolvedValueOnce({
          data: [
            createRemoteSyncedFileFixture({
              plainName: 'file_3',
            }),
          ],
        });

      await sut.startRemoteSync();

      expect(mockedAxios.get).toBeCalledTimes(2);
      expect(sut.getSyncStatus()).toBe('SYNCED');
    });
    it('Should sync all the folders', async () => {
      const sut = new RemoteSyncManager(
        {
          folders: inMemorySyncedFoldersCollection,
          files: inMemorySyncedFilesCollection,
        },
        {
          httpClient: mockedAxios,
          fetchFilesLimitPerRequest: 2,
          fetchFoldersLimitPerRequest: 2,
          syncFiles: false,
          syncFolders: true,
        },
        errorHandler
      );

      mockedAxios.get
        .mockResolvedValueOnce({
          data: [
            createRemoteSyncedFolderFixture({
              plainName: 'folder_1',
            }),
            createRemoteSyncedFolderFixture({
              plainName: 'folder_2',
            }),
          ],
        })
        .mockResolvedValueOnce({
          data: [
            createRemoteSyncedFolderFixture({
              plainName: 'folder_3',
            }),
            createRemoteSyncedFolderFixture({
              plainName: 'folder_4',
            }),
          ],
        })
        .mockResolvedValueOnce({
          data: [
            createRemoteSyncedFolderFixture({
              plainName: 'folder_5',
            }),
          ],
        });

      await sut.startRemoteSync();

      expect(mockedAxios.get).toBeCalledTimes(3);
      expect(sut.getSyncStatus()).toBe('SYNCED');
    });

    it('Should save the files in the database', async () => {
      const sut = new RemoteSyncManager(
        {
          folders: inMemorySyncedFoldersCollection,
          files: inMemorySyncedFilesCollection,
        },
        {
          httpClient: mockedAxios,
          fetchFilesLimitPerRequest: 2,
          fetchFoldersLimitPerRequest: 2,
          syncFiles: true,
          syncFolders: false,
        },
        errorHandler
      );
      const file1 = createRemoteSyncedFileFixture({
        plainName: 'file_1',
      });

      const file2 = createRemoteSyncedFileFixture({
        plainName: 'file_2',
      });

      mockedAxios.get.mockResolvedValueOnce({ data: [file1, file2] });

      mockedAxios.get.mockResolvedValueOnce({ data: [] });

      await sut.startRemoteSync();

      expect(mockedAxios.get).toBeCalledTimes(2);
      expect(sut.getSyncStatus()).toBe('SYNCED');
      expect(inMemorySyncedFilesCollection.create).toHaveBeenCalledWith(file1);
      expect(inMemorySyncedFilesCollection.create).toHaveBeenCalledWith(file2);
    });
  });

  describe('When something fails during the sync', () => {
    it('Should retry N times and then stop if sync does not succeed', async () => {
      mockedAxios.get.mockImplementation(() =>
        Promise.reject('Fail on purpose')
      );

      await sut.startRemoteSync();

      expect(mockedAxios.get).toBeCalledTimes(6);
      expect(sut.getSyncStatus()).toBe('SYNC_FAILED');
    });

    it('Should fail the sync if some files or folders cannot be retrieved', async () => {
      mockedAxios.get.mockRejectedValueOnce('Fail on purpose');

      await sut.startRemoteSync();

      expect(mockedAxios.get).toBeCalledTimes(6);
      expect(sut.getSyncStatus()).toBe('SYNC_FAILED');
    });

    it('should handle the error while syncing files by calling the error handler properly', async () => {
      const sut = new RemoteSyncManager(
        {
          folders: inMemorySyncedFoldersCollection,
          files: inMemorySyncedFilesCollection,
        },
        {
          httpClient: mockedAxios,
          fetchFilesLimitPerRequest: 2,
          fetchFoldersLimitPerRequest: 2,
          syncFiles: true,
          syncFolders: false,
        },
        errorHandler
      );
      mockedAxios.get.mockRejectedValueOnce('Fail on purpose');
      const errorHandlerInstance = sut['errorHandler'];
      const errorHandlerSpy = jest.spyOn(
        errorHandlerInstance,
        'handleSyncError'
      );

      await sut.startRemoteSync();

      expect(errorHandlerSpy).toHaveBeenCalled();
      expect(errorHandlerSpy.mock.calls[0][1]).toBe('files');
    });

    it('should handle the error while syncing folders by calling the error handler properly', async () => {
      const sut = new RemoteSyncManager(
        {
          folders: inMemorySyncedFoldersCollection,
          files: inMemorySyncedFilesCollection,
        },
        {
          httpClient: mockedAxios,
          fetchFilesLimitPerRequest: 2,
          fetchFoldersLimitPerRequest: 2,
          syncFiles: false,
          syncFolders: true,
        },
        errorHandler
      );

      mockedAxios.get.mockRejectedValueOnce('Fail on purpose');
      const errorHandlerInstance = sut['errorHandler'];
      const errorHandlerSpy = jest.spyOn(
        errorHandlerInstance,
        'handleSyncError'
      );

      await sut.startRemoteSync();

      expect(errorHandlerSpy).toHaveBeenCalled();
      expect(errorHandlerSpy.mock.calls[0][1]).toBe('folders');
    });
  });
});
