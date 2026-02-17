import { call, partialSpyOn } from 'tests/vitest/utils.helper';
import { loggerMock } from 'tests/vitest/mocks.helper';
import * as authServiceModule from '../../../../../apps/main/auth/service';
import { driveServerClient } from '../../../client/drive-server.client.instance';
import { DriveServerError } from '../../../drive-server.error';

import { fetchFolderTreeByUuid } from './fetch-folder-tree-by-uuid';

describe('fetch-folder-tree-by-uuid', () => {
  const driveServerGetMock = partialSpyOn(driveServerClient, 'GET');
  const getNewApiHeadersMock = partialSpyOn(authServiceModule, 'getNewApiHeaders');

  beforeEach(() => {
    getNewApiHeadersMock.mockReturnValue({});
  });

  it('should call GET /folders/{uuid}/tree with correct params', async () => {
    const treeData = { tree: { id: 1, children: [] } };
    driveServerGetMock.mockResolvedValue({ data: treeData } as object);

    await fetchFolderTreeByUuid({ uuid: 'folder-uuid' });

    expect(getNewApiHeadersMock).toBeCalled();
    call(driveServerGetMock).toMatchObject([
      '/folders/{uuid}/tree',
      {
        headers: {},
        path: { uuid: 'folder-uuid' },
      },
    ]);
  });

  it('should return data when the request is successful', async () => {
    const treeData = { tree: { id: 1, children: [] } };
    driveServerGetMock.mockResolvedValue({ data: treeData } as object);

    const result = await fetchFolderTreeByUuid({ uuid: 'folder-uuid' });

    expect(result.data).toMatchObject(treeData);
    expect(result.error).toBe(undefined);
  });

  it('should log and return error when the request fails', async () => {
    const error = new DriveServerError('BAD_REQUEST', 400);
    driveServerGetMock.mockResolvedValue({ data: undefined, error } as object);

    const result = await fetchFolderTreeByUuid({ uuid: 'folder-uuid' });

    expect(result.error).toBe(error);
    call(loggerMock.error).toMatchObject({
      msg: 'Failed to fetch folder tree',
      path: '/folders/folder-uuid/tree',
      error,
    });
  });
});
