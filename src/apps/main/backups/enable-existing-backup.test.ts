import { enableExistingBackup } from '../../../backend/features/backup/enable-existing-backup';
import configStore from '../config';
import { fetchFolder } from '../../../infra/drive-server/services/folder/services/fetch-folder';
import { createBackup } from '../../../backend/features/backup/create-backup';
import { migrateBackupEntryIfNeeded } from '../../../backend/features/backup/migrate-backup-entry-if-needed';
import { PATHS } from '../../../core/electron/paths';
import { createAbsolutePath } from '../../../context/local/localFile/infrastructure/AbsolutePath';

vi.mock('../config');
vi.mock('../../../infra/drive-server/services/folder/services/fetch-folder');
vi.mock('../../../backend/features/backup/create-backup');
vi.mock('../../../backend/features/backup/migrate-backup-entry-if-needed');

const mockedConfigStore = vi.mocked(configStore);
const mockedFetchFolder = vi.mocked(fetchFolder);
const mockedCreateBackup = vi.mocked(createBackup);
const mockedMigrateBackupEntryIfNeeded = vi.mocked(migrateBackupEntryIfNeeded);

describe('enable-existing-backup', () => {
  const mockDevice = {
    id: 123,
    bucket: 'test-bucket',
    uuid: 'device-uuid',
    name: 'Test Device',
    removed: false,
    hasBackups: false,
  };

  const pathname = createAbsolutePath('/path/to/backup');
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
    mockedFetchFolder.mockResolvedValue({ error: new Error('Folder not found') } as unknown as Awaited<
      ReturnType<typeof fetchFolder>
    >);
    mockedCreateBackup.mockResolvedValue({ data: mockNewBackupInfo } as unknown as Awaited<
      ReturnType<typeof createBackup>
    >);

    const result = await enableExistingBackup({ pathname, device: mockDevice });

    expect(mockedMigrateBackupEntryIfNeeded).not.toBeCalled();
    expect(mockedFetchFolder).toBeCalledWith(existingBackupData.folderUuid);
    expect(mockedCreateBackup).toBeCalledWith({ pathname, device: mockDevice });
    expect(result).toStrictEqual({ data: mockNewBackupInfo });
  });

  it('should enable existing backup when folder still exists', async () => {
    mockedConfigStore.get
      .mockReturnValueOnce({ [pathname]: existingBackupData })
      .mockReturnValueOnce({ [pathname]: existingBackupData });

    mockedFetchFolder.mockResolvedValue({ data: { id: existingBackupData.folderId } } as unknown as Awaited<
      ReturnType<typeof fetchFolder>
    >);

    const result = await enableExistingBackup({ pathname, device: mockDevice });

    expect(mockedMigrateBackupEntryIfNeeded).not.toBeCalled();
    expect(mockedFetchFolder).toBeCalledWith(existingBackupData.folderUuid);
    expect(mockedConfigStore.set).toBeCalledWith('backupList', {
      [pathname]: { ...existingBackupData, enabled: true },
    });

    expect(result).toStrictEqual({
      data: {
        folderUuid: existingBackupData.folderUuid,
        folderId: existingBackupData.folderId,
        pathname,
        name: 'backup',
        tmpPath: PATHS.TEMPORAL_FOLDER,
        backupsBucket: mockDevice.bucket,
      },
    });
  });
});
