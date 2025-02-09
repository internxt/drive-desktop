import { mockDeep } from 'vitest-mock-extended';
import { RemoteSyncManager } from './RemoteSyncManager';
import { DriveFile } from '../database/entities/DriveFile';
import { DriveFolder } from '../database/entities/DriveFolder';
import { DatabaseCollectionAdapter } from '../database/adapters/base';
import { Axios } from 'axios';

vi.mock('@sentry/electron/main', () => ({}));

describe('RemoteSyncManager.startRemoteSync', () => {
  const db = mockDeep<{ files: DatabaseCollectionAdapter<DriveFile>; folders: DatabaseCollectionAdapter<DriveFolder> }>();
  const config = mockDeep<{
    httpClient: Axios;
    fetchFilesLimitPerRequest: number;
    fetchFoldersLimitPerRequest: number;
    syncFiles: boolean;
    syncFolders: boolean;
  }>();
  const remoteSyncManager = new RemoteSyncManager(db, config);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('When status is SYNCING', () => {
    // Arrange
    remoteSyncManager.status = 'SYNCING';

    it('Then ignore and return empty lists', async () => {
      // Act
      const { files, folders } = await remoteSyncManager.startRemoteSync();

      // Assert
      expect(files).toEqual([]);
      expect(folders).toEqual([]);
    });
  });
});
