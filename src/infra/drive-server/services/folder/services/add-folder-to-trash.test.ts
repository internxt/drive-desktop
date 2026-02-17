import { call, partialSpyOn } from 'tests/vitest/utils.helper';
import { loggerMock } from 'tests/vitest/mocks.helper';
import * as authServiceModule from '../../../../../apps/main/auth/service';
import { driveServerClient } from '../../../client/drive-server.client.instance';
import { DriveServerError } from '../../../drive-server.error';

import { addFolderToTrash } from './add-folder-to-trash';

describe('add-folder-to-trash', () => {
  const driveServerPostMock = partialSpyOn(driveServerClient, 'POST');
  const getNewApiHeadersMock = partialSpyOn(authServiceModule, 'getNewApiHeaders');

  beforeEach(() => {
    getNewApiHeadersMock.mockReturnValue({});
  });

  it('should call POST /storage/trash/add with correct params', async () => {
    driveServerPostMock.mockResolvedValue({ data: {} } as object);

    await addFolderToTrash('folder-uuid');

    expect(getNewApiHeadersMock).toBeCalled();
    call(driveServerPostMock).toMatchObject([
      '/storage/trash/add',
      {
        headers: {},
        body: {
          items: [{ type: 'folder', uuid: 'folder-uuid' }],
        },
      },
    ]);
  });

  it('should return true when the request is successful', async () => {
    driveServerPostMock.mockResolvedValue({ data: {} } as object);

    const result = await addFolderToTrash('folder-uuid');

    expect(result.data).toBe(true);
    expect(result.error).toBe(undefined);
  });

  it('should log and return error when the request fails', async () => {
    const error = new DriveServerError('BAD_REQUEST', 400);
    driveServerPostMock.mockResolvedValue({ data: undefined, error } as object);

    const result = await addFolderToTrash('folder-uuid');

    expect(result.error).toBe(error);
    call(loggerMock.error).toMatchObject({
      msg: 'Error adding folder to trash',
      path: '/storage/trash/add',
      error,
    });
  });
});
