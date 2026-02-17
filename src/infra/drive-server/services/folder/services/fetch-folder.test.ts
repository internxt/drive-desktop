import { call, partialSpyOn } from 'tests/vitest/utils.helper';
import { loggerMock } from 'tests/vitest/mocks.helper';
import * as authServiceModule from '../../../../../apps/main/auth/service';
import { driveServerClient } from '../../../client/drive-server.client.instance';
import { DriveServerError } from '../../../drive-server.error';

import { fetchFolder } from './fetch-folder';

describe('fetch-folder', () => {
  const driveServerGetMock = partialSpyOn(driveServerClient, 'GET');
  const getNewApiHeadersMock = partialSpyOn(authServiceModule, 'getNewApiHeaders');

  beforeEach(() => {
    getNewApiHeadersMock.mockReturnValue({});
  });

  it('should call GET /folders/content/{uuid} with correct params', async () => {
    const folderData = { uuid: 'folder-uuid', deleted: false, removed: false };
    driveServerGetMock.mockResolvedValue({ data: folderData } as object);

    await fetchFolder('folder-uuid');

    expect(getNewApiHeadersMock).toBeCalled();
    call(driveServerGetMock).toMatchObject([
      '/folders/content/{uuid}',
      {
        headers: {},
        path: { uuid: 'folder-uuid' },
      },
    ]);
  });

  it('should return data when the request is successful', async () => {
    const folderData = { uuid: 'folder-uuid', deleted: false, removed: false };
    driveServerGetMock.mockResolvedValue({ data: folderData } as object);

    const result = await fetchFolder('folder-uuid');

    expect(result.data).toMatchObject(folderData);
    expect(result.error).toBe(undefined);
  });

  it('should log and return error when the request fails', async () => {
    const error = new DriveServerError('BAD_REQUEST', 400);
    driveServerGetMock.mockResolvedValue({ data: undefined, error } as object);

    const result = await fetchFolder('folder-uuid');

    expect(result.error).toBe(error);
    call(loggerMock.error).toMatchObject({
      msg: 'Failed to fetch folder content',
      path: '/folders/content/folder-uuid',
      error,
    });
  });

  it('should return NOT_FOUND error when folder is deleted', async () => {
    const folderData = { uuid: 'folder-uuid', deleted: true, removed: false };
    driveServerGetMock.mockResolvedValue({ data: folderData } as object);

    const result = await fetchFolder('folder-uuid');

    expect(result.error).toMatchObject({ cause: 'NOT_FOUND' });
    expect(result.data).toBe(undefined);
    call(loggerMock.error).toMatchObject({
      msg: 'Folder is marked as deleted or removed',
      path: '/folders/content/folder-uuid',
    });
  });

  it('should return NOT_FOUND error when folder is removed', async () => {
    const folderData = { uuid: 'folder-uuid', deleted: false, removed: true };
    driveServerGetMock.mockResolvedValue({ data: folderData } as object);

    const result = await fetchFolder('folder-uuid');

    expect(result.error).toMatchObject({ cause: 'NOT_FOUND' });
    expect(result.data).toBe(undefined);
    call(loggerMock.error).toMatchObject({
      msg: 'Folder is marked as deleted or removed',
      path: '/folders/content/folder-uuid',
    });
  });
});
