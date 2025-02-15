import { RemoteSyncManager } from './RemoteSyncManager';
import { RemoteSyncedFile, RemoteSyncedFolder } from './helpers';
import * as uuid from 'uuid';
import axios from 'axios';
import { DatabaseCollectionAdapter } from '../database/adapters/base';
import { DriveFile } from '../database/entities/DriveFile';
import { DriveFolder } from '../database/entities/DriveFolder';
import { Mocked } from 'vitest';
import { mockDeep } from 'vitest-mock-extended';

vi.mock('@sentry/electron/main', () => ({
  init: () => vi.fn(),
  captureException: () => vi.fn(),
}));

vi.mock('electron');
vi.mock('electron-store');
vi.mock('axios');

const mockedAxios = axios as Mocked<typeof axios>;

const inMemorySyncedFilesCollection = mockDeep<DatabaseCollectionAdapter<DriveFile>>();
const inMemorySyncedFoldersCollection = mockDeep<DatabaseCollectionAdapter<DriveFolder>>();

const createRemoteSyncedFileFixture = (payload: Partial<RemoteSyncedFile>): RemoteSyncedFile => {
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

const createRemoteSyncedFolderFixture = (payload: Partial<RemoteSyncedFolder>): RemoteSyncedFolder => {
  const result: RemoteSyncedFolder = {
    name: `name_${uuid.v4()}`,
    plainName: `folder_${Date.now()}`,
    id: Date.now(),
    type: 'folder',
    bucket: `bucket_${Date.now()}`,
    userId: 567,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    parentId: 555,
    uuid: uuid.v4(),
    status: 'EXISTS',
    ...payload,
  };

  return result;
};

describe('RemoteSyncManager', () => {
  let sut: RemoteSyncManager = new RemoteSyncManager(
    {
      folders: inMemorySyncedFoldersCollection,
      files: inMemorySyncedFilesCollection,
    },
    {
      httpClient: mockedAxios,
      fetchFilesLimitPerRequest: 2,
      fetchFoldersLimitPerRequest: 2,
    },
  );

  inMemorySyncedFilesCollection.getLastUpdated.mockImplementation(() => Promise.resolve({ success: false, result: null }));
  inMemorySyncedFoldersCollection.getLastUpdated.mockImplementation(() => Promise.resolve({ success: false, result: null }));

  beforeEach(() => {
    sut = new RemoteSyncManager(
      {
        folders: inMemorySyncedFoldersCollection,
        files: inMemorySyncedFilesCollection,
      },
      {
        httpClient: mockedAxios,
        fetchFilesLimitPerRequest: 2,
        fetchFoldersLimitPerRequest: 2,
      },
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
        },
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
        },
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
        },
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
      mockedAxios.get.mockImplementation(() => Promise.reject('Fail on purpose'));

      await sut.startRemoteSync();

      expect(mockedAxios.get).toBeCalledTimes(6);
      expect(sut.getSyncStatus()).toBe('SYNC_FAILED');
    });

    it('Should fail the sync if some files or folders cannot be retrieved', async () => {
      inMemorySyncedFilesCollection.getLastUpdated.mockImplementation(() => Promise.resolve({ success: false, result: null }));
      inMemorySyncedFoldersCollection.getLastUpdated.mockImplementation(() => Promise.resolve({ success: false, result: null }));

      const sut = new RemoteSyncManager(
        {
          folders: inMemorySyncedFoldersCollection,
          files: inMemorySyncedFilesCollection,
        },
        {
          httpClient: mockedAxios,
          fetchFilesLimitPerRequest: 2,
          fetchFoldersLimitPerRequest: 2,
        },
      );

      mockedAxios.get.mockRejectedValueOnce('Fail on purpose');

      await sut.startRemoteSync();

      expect(mockedAxios.get).toBeCalledTimes(6);
      expect(sut.getSyncStatus()).toBe('SYNC_FAILED');
    });
  });
});
