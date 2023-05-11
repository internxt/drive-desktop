import { DatabaseAdapter } from 'main/database/adapters/base';
import { RemoteSyncManager } from './RemoteSyncManager';
import { RemoteSyncedFile, RemoteSyncedFolder } from './helpers';
import { sleep } from '../util';

const inMemorySyncedFilesAdapter: DatabaseAdapter<RemoteSyncedFile> = {
  get: jest.fn(),
  connect: jest.fn(),
  update: jest.fn(),
  create: jest.fn(),
  remove: jest.fn(),
};

const inMemorySyncedFoldersAdapter: DatabaseAdapter<RemoteSyncedFolder> = {
  get: jest.fn(),
  connect: jest.fn(),
  update: jest.fn(),
  create: jest.fn(),
  remove: jest.fn(),
};

const createRemoteSyncedFileFixture = (
  payload: Partial<RemoteSyncedFile>
): RemoteSyncedFile => {
  const result: RemoteSyncedFile = {
    plainName: `file_${Date.now()}`,
    id: Date.now(),
    fileId: Date.now().toString(),
    type: 'jpg',
    size: '999',
    bucket: `bucket_${Date.now()}`,
    folderId: 555,
    folderUuid: '',
    encryptVersion: '03-aes',
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
    plainName: `folder_${Date.now()}`,
    id: Date.now(),
    type: 'folder',
    bucket: `bucket_${Date.now()}`,
    userId: 567,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    parentId: null,
    uuid: `xxxxx-xxxxx-${Date.now()}`,
    status: 'EXISTS',
    ...payload,
  };

  return result;
};

global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve({}),
  })
) as jest.Mock;

describe('RemoteSyncManager', () => {
  let sut: RemoteSyncManager = new RemoteSyncManager(
    {
      folders: inMemorySyncedFoldersAdapter,
      files: inMemorySyncedFilesAdapter,
    },
    {
      fetchFilesLimitPerRequest: 2,
      fetchFoldersLimitPerRequest: 2,
      syncFiles: true,
      syncFolders: true,
    }
  );
  beforeEach(() => {
    sut = new RemoteSyncManager(
      {
        folders: inMemorySyncedFoldersAdapter,
        files: inMemorySyncedFilesAdapter,
      },
      {
        fetchFilesLimitPerRequest: 2,
        fetchFoldersLimitPerRequest: 2,
        syncFiles: true,
        syncFolders: true,
      }
    );
    (fetch as jest.Mock).mockClear();
  });

  it('Should fetch 2 pages of remote files', async () => {
    const sut = new RemoteSyncManager(
      {
        folders: inMemorySyncedFoldersAdapter,
        files: inMemorySyncedFilesAdapter,
      },
      {
        fetchFilesLimitPerRequest: 2,
        fetchFoldersLimitPerRequest: 2,
        syncFiles: true,
        syncFolders: false,
      }
    );
    (global.fetch as jest.Mock)
      .mockImplementationOnce(() => {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve<RemoteSyncedFile[]>([
              createRemoteSyncedFileFixture({
                plainName: 'file_1',
              }),
              createRemoteSyncedFileFixture({
                plainName: 'file_2',
              }),
            ]),
        });
      })
      .mockImplementationOnce(() => {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve<RemoteSyncedFile[]>([
              createRemoteSyncedFileFixture({
                plainName: 'file_3',
              }),
            ]),
        });
      });

    await sut.startRemoteSync();

    expect((global.fetch as jest.Mock).mock.calls.length).toBe(2);
    expect(sut.getSyncStatus()).toBe('SYNCED');
  });

  it('Should fetch 3 pages of remote folders', async () => {
    const sut = new RemoteSyncManager(
      {
        folders: inMemorySyncedFoldersAdapter,
        files: inMemorySyncedFilesAdapter,
      },
      {
        fetchFilesLimitPerRequest: 2,
        fetchFoldersLimitPerRequest: 2,
        syncFiles: false,
        syncFolders: true,
      }
    );
    (global.fetch as jest.Mock)
      .mockImplementationOnce(() => {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve<RemoteSyncedFolder[]>([
              createRemoteSyncedFolderFixture({
                plainName: 'folder_1',
              }),
              createRemoteSyncedFolderFixture({
                plainName: 'folder_2',
              }),
            ]),
        });
      })
      .mockImplementationOnce(() => {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve<RemoteSyncedFolder[]>([
              createRemoteSyncedFolderFixture({
                plainName: 'folder_3',
              }),
              createRemoteSyncedFolderFixture({
                plainName: 'folder_4',
              }),
            ]),
        });
      })
      .mockImplementationOnce(() => {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve<RemoteSyncedFolder[]>([
              createRemoteSyncedFolderFixture({
                plainName: 'folder_5',
              }),
            ]),
        });
      });

    await sut.startRemoteSync();

    expect((global.fetch as jest.Mock).mock.calls.length).toBe(3);
    expect(sut.getSyncStatus()).toBe('SYNCED');
  });

  it('Should retry N times and then stop if sync does not succeed', async () => {
    (global.fetch as jest.Mock).mockImplementation(() =>
      Promise.reject('Fail on purpose')
    );

    await sut.startRemoteSync();

    await sleep(50);
    expect((global.fetch as jest.Mock).mock.calls.length).toBe(6);
    expect(sut.getSyncStatus()).toBe('SYNC_FAILED');
  });

  it('Should fail the sync if some files or folders cannot be retrieved', async () => {
    const sut = new RemoteSyncManager(
      {
        folders: inMemorySyncedFoldersAdapter,
        files: inMemorySyncedFilesAdapter,
      },
      {
        fetchFilesLimitPerRequest: 2,
        fetchFoldersLimitPerRequest: 2,
        syncFiles: true,
        syncFolders: true,
      }
    );
    (global.fetch as jest.Mock).mockImplementationOnce(() =>
      Promise.reject('Fail on purpose')
    );

    await sut.startRemoteSync();

    await sleep(200);
    expect((global.fetch as jest.Mock).mock.calls.length).toBe(6);
    expect(sut.getSyncStatus()).toBe('SYNC_FAILED');
  });

  it('Should save the files in the database', async () => {
    const sut = new RemoteSyncManager(
      {
        folders: inMemorySyncedFoldersAdapter,
        files: inMemorySyncedFilesAdapter,
      },
      {
        fetchFilesLimitPerRequest: 2,
        fetchFoldersLimitPerRequest: 2,
        syncFiles: true,
        syncFolders: false,
      }
    );
    const file1 = createRemoteSyncedFileFixture({
      plainName: 'file_1',
    });

    const file2 = createRemoteSyncedFileFixture({
      plainName: 'file_2',
    });

    (global.fetch as jest.Mock)
      .mockImplementationOnce(() => {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve<RemoteSyncedFile[]>([file1, file2]),
        });
      })
      .mockImplementationOnce(() => {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve<RemoteSyncedFile[]>([]),
        });
      });

    await sut.startRemoteSync();

    expect((global.fetch as jest.Mock).mock.calls.length).toBe(2);
    expect(sut.getSyncStatus()).toBe('SYNCED');
    expect(inMemorySyncedFilesAdapter.create).toHaveBeenCalledWith(file1);
    expect(inMemorySyncedFilesAdapter.create).toHaveBeenCalledWith(file2);
  });
});
