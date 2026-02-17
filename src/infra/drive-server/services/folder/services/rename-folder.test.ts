import { call, partialSpyOn } from 'tests/vitest/utils.helper';
import { loggerMock } from 'tests/vitest/mocks.helper';
import * as authServiceModule from '../../../../../apps/main/auth/service';
import { driveServerClient } from '../../../client/drive-server.client.instance';
import { DriveServerError } from '../../../drive-server.error';

import { renameFolder } from './rename-folder';

describe('rename-folder', () => {
  const driveServerPutMock = partialSpyOn(driveServerClient, 'PUT');
  const getNewApiHeadersMock = partialSpyOn(authServiceModule, 'getNewApiHeaders');

  beforeEach(() => {
    getNewApiHeadersMock.mockReturnValue({});
  });

  it('should call PUT /folders/{uuid}/meta with correct params', async () => {
    const folderData = { id: 1, uuid: 'folder-uuid' };
    driveServerPutMock.mockResolvedValue({ data: folderData } as object);

    await renameFolder({ uuid: 'folder-uuid', plainName: 'New Name' });

    expect(getNewApiHeadersMock).toBeCalled();
    call(driveServerPutMock).toMatchObject([
      '/folders/{uuid}/meta',
      {
        headers: {},
        path: { uuid: 'folder-uuid' },
        body: { plainName: 'New Name' },
      },
    ]);
  });

  it('should return data when the request is successful', async () => {
    const folderData = { id: 1, uuid: 'folder-uuid' };
    driveServerPutMock.mockResolvedValue({ data: folderData } as object);

    const result = await renameFolder({ uuid: 'folder-uuid', plainName: 'New Name' });

    expect(result.data).toMatchObject(folderData);
    expect(result.error).toBe(undefined);
  });

  it('should log and return error when the request fails', async () => {
    const error = new DriveServerError('BAD_REQUEST', 400);
    driveServerPutMock.mockResolvedValue({ data: undefined, error } as object);

    const result = await renameFolder({ uuid: 'folder-uuid', plainName: 'New Name' });

    expect(result.error).toBe(error);
    call(loggerMock.error).toMatchObject({
      msg: 'Failed to update folder name',
      path: '/folders/folder-uuid/meta',
      error,
    });
  });
});
