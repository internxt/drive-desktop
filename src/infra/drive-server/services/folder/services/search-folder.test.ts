import { call, partialSpyOn } from 'tests/vitest/utils.helper';
import { loggerMock } from 'tests/vitest/mocks.helper';
import * as authServiceModule from '../../../../../apps/main/auth/service';
import { driveServerClient } from '../../../client/drive-server.client.instance';
import { DriveServerError } from '../../../drive-server.error';

import { searchFolder } from './search-folder';

describe('search-folder', () => {
  const driveServerGetMock = partialSpyOn(driveServerClient, 'GET');
  const getNewApiHeadersMock = partialSpyOn(authServiceModule, 'getNewApiHeaders');

  beforeEach(() => {
    getNewApiHeadersMock.mockReturnValue({});
  });

  it('should call GET /folders/{id}/folders with correct params', async () => {
    driveServerGetMock.mockResolvedValue({ data: { result: [] } } as object);

    await searchFolder({ parentId: 123, offset: 0, limit: 50 });

    expect(getNewApiHeadersMock).toBeCalled();
    call(driveServerGetMock).toMatchObject([
      '/folders/{id}/folders',
      {
        headers: {},
        path: { id: 123 },
        query: { offset: 0, limit: 50 },
      },
    ]);
  });

  it('should use default limit of 50', async () => {
    driveServerGetMock.mockResolvedValue({ data: { result: [] } } as object);

    await searchFolder({ parentId: 123, offset: 0 });

    call(driveServerGetMock).toMatchObject([
      '/folders/{id}/folders',
      {
        query: { offset: 0, limit: 50 },
      },
    ]);
  });

  it('should return the result array when the request is successful', async () => {
    const folders = [{ id: 1, uuid: 'folder-uuid', plainName: 'test' }];
    driveServerGetMock.mockResolvedValue({ data: { result: folders } } as object);

    const result = await searchFolder({ parentId: 123, offset: 0 });

    expect(result.data).toMatchObject(folders);
    expect(result.error).toBe(undefined);
  });

  it('should log and return error when the request fails', async () => {
    const error = new DriveServerError('BAD_REQUEST', 400);
    driveServerGetMock.mockResolvedValue({ data: undefined, error } as object);

    const result = await searchFolder({ parentId: 123, offset: 0 });

    expect(result.error).toBe(error);
    call(loggerMock.error).toMatchObject({
      msg: 'Error searching subfolders',
      path: '/folders/123/folders',
      error,
    });
  });
});
