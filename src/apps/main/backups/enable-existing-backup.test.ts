import { enableExistingBackup } from './enable-existing-backup';
import configStore from '../config';
import { fetchFolder } from '../../../infra/drive-server/services/folder/services/fetch-folder';
import { createBackup } from './create-backup';
import { migrateBackupEntryIfNeeded } from '../device/migrate-backup-entry-if-needed';
import { app } from 'electron';

vi.mock('../config');
vi.mock('../../../infra/drive-server/services/folder/services/fetch-folder');
vi.mock('./create-backup');
vi.mock('../device/migrate-backup-entry-if-needed');

const mockedConfigStore = vi.mocked(configStore);
const mockedFetchFolder = vi.mocked(fetchFolder);
const mockedCreateBackup = vi.mocked(createBackup);
const mockedMigrateBackupEntryIfNeeded = vi.mocked(migrateBackupEntryIfNeeded);
const mockedApp = vi.mocked(app);

describe('enableExistingBackup', () => {
  const mockDevice = {
    id: 123,
    bucket: 'test-bucket',
    uuid: 'device-uuid',
    name: 'Test Device',
    removed: false,
    hasBackups: false,
  };

  const pathname = '/path/to/backup';
  const existingBackupData = {
    folderUuid: 'existing-uuid',
    folderId: 456,
    enabled: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create new backup when folder no longer exists', async () => {
    const mockNewBackupInfo = {
      folderUuid: 'new-folder-uuid',
      folderId: 789,
      pathname,
      name: 'backup',
      tmpPath: '/tmp',
      backupsBucket: 'test-bucket',
    };

    mockedConfigStore.get.mockReturnValue({ [pathname]: existingBackupData });
    mockedMigrateBackupEntryIfNeeded.mockResolvedValue(existingBackupData);
    mockedFetchFolder.mockResolvedValue({ error: new Error('Folder not found') } as any);
    mockedCreateBackup.mockResolvedValue(mockNewBackupInfo);

    const result = await enableExistingBackup(pathname, mockDevice);

    expect(mockedMigrateBackupEntryIfNeeded).toBeCalledWith(pathname, existingBackupData);
    expect(mockedFetchFolder).toBeCalledWith(existingBackupData.folderUuid);
    expect(mockedCreateBackup).toBeCalledWith({ pathname, device: mockDevice });
    expect(result).toStrictEqual(mockNewBackupInfo);
  });

  it('should enable existing backup when folder still exists', async () => {
    const migratedBackup = {
      folderUuid: 'migrated-uuid',
      folderId: 456,
      enabled: false,
    };

    const updatedBackupList = {
      [pathname]: { ...migratedBackup, enabled: true },
    };

    mockedConfigStore.get
      .mockReturnValueOnce({ [pathname]: existingBackupData })
      .mockReturnValueOnce(updatedBackupList);

    mockedMigrateBackupEntryIfNeeded.mockResolvedValue(migratedBackup);
    mockedFetchFolder.mockResolvedValue({ data: { id: migratedBackup.folderId } } as any);
    mockedApp.getPath.mockReturnValue('/tmp');

    const result = await enableExistingBackup(pathname, mockDevice);

    expect(mockedMigrateBackupEntryIfNeeded).toBeCalledWith(pathname, existingBackupData);
    expect(mockedFetchFolder).toBeCalledWith(migratedBackup.folderUuid);
    expect(mockedConfigStore.set).toBeCalledWith('backupList', updatedBackupList);
    expect(mockedApp.getPath).toBeCalledWith('temp');

    expect(result).toEqual({
      folderUuid: migratedBackup.folderUuid,
      folderId: migratedBackup.folderId,
      pathname,
      name: 'backup',
      tmpPath: '/tmp',
      backupsBucket: mockDevice.bucket,
    });
  });
});
