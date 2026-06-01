import { createBackup } from './create-backup';
import { createBackupFolder } from '../../../backend/features/backup/create-backup-folder';
import configStore from '../../../apps/main/config';
import { AbsolutePath } from '../../../context/local/localFile/infrastructure/AbsolutePath';
import { app } from 'electron';
import path from 'node:path';
import { DriveServerError } from 'src/infra/drive-server/drive-server.error';

vi.mock('./create-backup-folder');
vi.mock('../../../apps/main/config');
vi.mock('node:path');

const mockPostBackup = vi.mocked(createBackupFolder);
const mockConfigStore = vi.mocked(configStore);
const mockApp = vi.mocked(app);
const mockPath = vi.mocked(path);

describe('createBackup', () => {
  const mockDevice = {
    id: 1,
    uuid: 'device-123',
    bucket: 'test-bucket',
    name: 'Test Device',
    removed: false,
    hasBackups: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockPath.parse.mockReturnValue({
      root: '/',
      dir: '/home/user',
      base: 'TestFolder',
      ext: '',
      name: 'TestFolder',
    });

    mockApp.getPath.mockReturnValue('/tmp');
    mockConfigStore.get.mockReturnValue({});
  });

  it('should create backup successfully', async () => {
    mockPostBackup.mockResolvedValue({
      data: {
        id: 123,
        name: 'TestFolder',
        uuid: 'backup-uuid-456',
      },
    });

    const result = await createBackup({
      pathname: '/home/user/TestFolder' as AbsolutePath,
      device: mockDevice,
    });

    expect(mockPostBackup).toBeCalledWith({
      folderName: 'TestFolder',
      device: mockDevice,
    });

    expect(mockConfigStore.set).toBeCalledWith('backupList', {
      '/home/user/TestFolder': {
        enabled: true,
        folderId: 123,
        folderUuid: 'backup-uuid-456',
      },
    });

    expect(result).toStrictEqual({
      data: {
        folderUuid: 'backup-uuid-456',
        folderId: 123,
        pathname: '/home/user/TestFolder',
        name: 'TestFolder',
        tmpPath: '/tmp',
        backupsBucket: 'test-bucket',
      },
    });
  });

  it('should return undefined when createBackupFolder fails', async () => {
    mockPostBackup.mockResolvedValue({
      error: new DriveServerError('NOT_FOUND'),
    });

    const result = await createBackup({
      pathname: '/home/user/FailedFolder' as AbsolutePath,
      device: mockDevice,
    });

    expect(result).toStrictEqual({ error: expect.any(Error) });
    expect(mockConfigStore.set).not.toBeCalled();
  });
});
