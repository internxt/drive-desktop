import { call, partialSpyOn } from 'tests/vitest/utils.helper';
import { loggerMock } from 'tests/vitest/mocks.helper';
import * as authServiceModule from '../../../../../apps/main/auth/service';
import { driveServerClient } from '../../../client/drive-server.client.instance';
import { DriveServerError } from '../../../drive-server.error';

import { getBackupFolderUuid } from './fetch-backup-folder-uuid';

describe('fetch-backup-folder-uuid', () => {
  const driveServerGetMock = partialSpyOn(driveServerClient, 'GET');
  const getNewApiHeadersMock = partialSpyOn(authServiceModule, 'getNewApiHeaders');

  beforeEach(() => {
    getNewApiHeadersMock.mockReturnValue({});
  });

  it('should call GET /folders/{id}/metadata with correct params', async () => {
    const folderData = { uuid: 'folder-uuid' };
    driveServerGetMock.mockResolvedValue({ data: folderData } as object);

    await getBackupFolderUuid({ folderId: '123' });

    expect(getNewApiHeadersMock).toBeCalled();
    call(driveServerGetMock).toMatchObject([
      '/folders/{id}/metadata',
      {
        headers: {},
        path: { id: '123' },
      },
    ]);
  });

  it('should return the folder uuid when the request is successful', async () => {
    const folderData = { uuid: 'folder-uuid' };
    driveServerGetMock.mockResolvedValue({ data: folderData } as object);

    const result = await getBackupFolderUuid({ folderId: '123' });

    expect(result.data).toBe('folder-uuid');
    expect(result.error).toBe(undefined);
  });

  it('should log and return error when the request fails', async () => {
    const error = new DriveServerError('BAD_REQUEST', 400);
    driveServerGetMock.mockResolvedValue({ data: undefined, error } as object);

    const result = await getBackupFolderUuid({ folderId: '123' });

    expect(result.error).toBe(error);
    call(loggerMock.error).toMatchObject({
      msg: 'Failed to fetch backup folder UUID',
      path: '/folders/123/metadata',
      error,
    });
  });
});
