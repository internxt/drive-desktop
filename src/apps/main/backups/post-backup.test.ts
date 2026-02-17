import { postBackup } from './post-backup';
import * as createFolderModule from '../../../infra/drive-server/services/folder/services/create-folder';
import { logger } from '@internxt/drive-desktop-core/build/backend';
import { DriveServerError } from '../../../infra/drive-server/drive-server.error';
import { call } from '../../../../tests/vitest/utils.helper';
import { partialSpyOn } from '../../../../tests/vitest/utils.helper';

vi.mock(import('@internxt/drive-desktop-core/build/backend'));

const createFolderMock = partialSpyOn(createFolderModule, 'createFolder');
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
});
