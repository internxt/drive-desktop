import { postBackup } from './post-backup';
import * as createFolderModule from '../../../infra/drive-server/services/folder/services/create-folder';
import { logger } from '@internxt/drive-desktop-core/build/backend';
import { DriveServerError } from '../../../infra/drive-server/drive-server.error';
import { call } from '../../../../tests/vitest/utils.helper';
import { partialSpyOn } from '../../../../tests/vitest/utils.helper';
import * as findBackupFolderByNameModule from './find-backup-folder-by-name';

vi.mock(import('@internxt/drive-desktop-core/build/backend'));

const createFolderMock = partialSpyOn(createFolderModule, 'createFolder');
const findBackupFolderByNameMock = partialSpyOn(findBackupFolderByNameModule, 'findBackupFolderByName');
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

    createFolderMock.mockResolvedValue({
      data: mockFolderData,
    });

    const result = await postBackup({
      folderName: 'My Folder',
      device: mockDevice,
    });

    call(createFolderMock).toMatchObject({
      parentFolderUuid: 'device-123',
      plainName: 'My Folder',
    });
    expect(result).toStrictEqual({
      data: {
        id: 456,
        name: 'My Folder',
        uuid: 'folder-uuid-789',
      },
    });
  });

  it('should handle errors and return error result', async () => {
    const error = new DriveServerError('BAD_REQUEST');

    createFolderMock.mockResolvedValue({
      error,
    });

    const result = await postBackup({
      folderName: 'Failed Folder',
      device: mockDevice,
    });

    call(mockLogger.error).toMatchObject({
      tag: 'BACKUPS',
      msg: 'Error creating backup folder',
      folderName: 'Failed Folder',
      error,
    });
    expect(result).toStrictEqual({ error });
  });

  it('should recover existing backup when folder creation conflicts', async () => {
    createFolderMock.mockResolvedValue({
      error: new DriveServerError('CONFLICT'),
    });

    findBackupFolderByNameMock.mockResolvedValue({
      id: 900,
      name: 'Existing Folder',
      uuid: 'existing-folder-uuid',
    });

    const result = await postBackup({
      folderName: 'Existing Folder',
      device: mockDevice,
    });

    call(findBackupFolderByNameMock).toMatchObject({
      deviceUuid: 'device-123',
      folderName: 'Existing Folder',
    });
    expect(result).toStrictEqual({
      data: {
        id: 900,
        name: 'Existing Folder',
        uuid: 'existing-folder-uuid',
      },
    });
  });

  it('should return conflict error when existing backup cannot be found', async () => {
    const conflictError = new DriveServerError('CONFLICT');

    createFolderMock.mockResolvedValue({
      error: conflictError,
    });

    findBackupFolderByNameMock.mockResolvedValue(undefined);

    const result = await postBackup({
      folderName: 'Existing Folder',
      device: mockDevice,
    });

    expect(result).toStrictEqual({ error: conflictError });
  });
});
