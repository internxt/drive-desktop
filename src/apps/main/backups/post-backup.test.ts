import { postBackup } from './post-backup';
import { BackupError } from '../../backups/BackupError';
import { createBackupFolder } from '../../../infra/drive-server/services/backup/services/create-backup-folder';
import { logger } from '@internxt/drive-desktop-core/build/backend';
import { components } from '../../../infra/schemas';

vi.mock('../../../infra/drive-server/services/backup/services/create-backup-folder');

const mockCreateBackupFolder = vi.mocked(createBackupFolder);
const mockLogger = vi.mocked(logger);

describe('postBackup', () => {
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
  });

  it('should create backup successfully', async () => {
    const mockFolderData = {
      id: 456,
      plainName: 'My Folder',
      uuid: 'folder-uuid-789',
    };

    mockCreateBackupFolder.mockResolvedValue({
      data: mockFolderData as components['schemas']['FolderDto'],
    });

    const result = await postBackup({
      folderName: 'My Folder',
      device: mockDevice,
    });

    expect(mockCreateBackupFolder).toBeCalledWith('device-123', 'My Folder');
    expect(result).toEqual({
      data: {
        id: 456,
        name: 'My Folder',
        uuid: 'folder-uuid-789',
      },
    });
  });

  it('should handle errors and return undefined', async () => {
    mockCreateBackupFolder.mockResolvedValue({
      error: new BackupError('NOT_EXISTS'),
    });

    const result = await postBackup({
      folderName: 'Failed Folder',
      device: mockDevice,
    });

    expect(mockLogger.error).toHaveBeenCalledWith({
      tag: 'BACKUPS',
      msg: 'Error creating backup folder',
      folderName: 'Failed Folder',
      error: expect.any(BackupError),
    });
    expect(result).toStrictEqual({ error: expect.any(BackupError) });
  });
});
