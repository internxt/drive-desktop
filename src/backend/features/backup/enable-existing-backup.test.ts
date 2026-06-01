import { enableExistingBackup } from './enable-existing-backup';
import configStore from '../../../apps/main/config';
import { fetchFolder } from '../../../infra/drive-server/services/folder/services/fetch-folder';
import { createBackup } from './create-backup';
import { migrateBackupEntryIfNeeded } from './migrate-backup-entry-if-needed';
import { PATHS } from '../../../core/electron/paths';
import { createAbsolutePath } from '../../../context/local/localFile/infrastructure/AbsolutePath';
import { DriveServerError } from 'src/infra/drive-server/drive-server.error';
import { GetFolderContentDto } from 'src/infra/drive-server/out/dto';

vi.mock('../../../apps/main/config');
vi.mock('../../../infra/drive-server/services/folder/services/fetch-folder');
vi.mock('./create-backup');
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
    mockedFetchFolder.mockResolvedValue({ error: new DriveServerError('NOT_FOUND', 400, 'Folder not found') });
    mockedCreateBackup.mockResolvedValue({ data: mockNewBackupInfo });

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

    mockedFetchFolder.mockResolvedValue({
      data: { id: existingBackupData.folderId } as unknown as GetFolderContentDto,
    });

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
