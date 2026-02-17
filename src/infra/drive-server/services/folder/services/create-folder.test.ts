import { call, partialSpyOn } from 'tests/vitest/utils.helper';
import { loggerMock } from 'tests/vitest/mocks.helper';
import * as authServiceModule from '../../../../../apps/main/auth/service';
import { driveServerClient } from '../../../client/drive-server.client.instance';
import { DriveServerError } from '../../../drive-server.error';

import { createFolder } from './create-folder';

describe('create-folder', () => {
  const driveServerPostMock = partialSpyOn(driveServerClient, 'POST');
  const getNewApiHeadersMock = partialSpyOn(authServiceModule, 'getNewApiHeaders');

  beforeEach(() => {
    getNewApiHeadersMock.mockReturnValue({});
  });

  it('should call POST /folders with correct params', async () => {
    const folderData = { id: 1, uuid: 'folder-uuid' };
    driveServerPostMock.mockResolvedValue({ data: folderData } as object);

    await createFolder({ parentFolderUuid: 'parent-uuid', plainName: 'My Folder' });

    expect(getNewApiHeadersMock).toBeCalled();
    call(driveServerPostMock).toMatchObject([
      '/folders',
      {
        headers: {},
        body: {
          parentFolderUuid: 'parent-uuid',
          plainName: 'My Folder',
        },
      },
    ]);
  });

  it('should return data when the request is successful', async () => {
    const folderData = { id: 1, uuid: 'folder-uuid' };
    driveServerPostMock.mockResolvedValue({ data: folderData } as object);

    const result = await createFolder({ parentFolderUuid: 'parent-uuid', plainName: 'My Folder' });

    expect(result.data).toMatchObject(folderData);
    expect(result.error).toBe(undefined);
  });

  it('should log and return error when the request fails', async () => {
    const error = new DriveServerError('BAD_REQUEST', 400);
    driveServerPostMock.mockResolvedValue({ data: undefined, error } as object);

    const result = await createFolder({ parentFolderUuid: 'parent-uuid', plainName: 'My Folder' });

    expect(result.error).toBe(error);
    call(loggerMock.error).toMatchObject({
      msg: 'error creating a folder',
      path: '/folders',
      error,
    });
  });
});
