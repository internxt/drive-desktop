import { call, partialSpyOn } from 'tests/vitest/utils.helper';
import { loggerMock } from 'tests/vitest/mocks.helper';
import * as authServiceModule from '../../../../../apps/main/auth/service';
import { driveServerClient } from '../../../client/drive-server.client.instance';
import { DriveServerError } from '../../../drive-server.error';

import { renameFile } from './rename-file';

describe('renameFile', () => {
  const driveServerPutMock = partialSpyOn(driveServerClient, 'PUT');
  const getNewApiHeadersMock = partialSpyOn(authServiceModule, 'getNewApiHeaders');

  beforeEach(() => {
    getNewApiHeadersMock.mockReturnValue({});
  });

  it('should return data when the request is successful', async () => {
    const fileData = { id: 1, uuid: 'file-uuid', plainName: 'new-name' };
    driveServerPutMock.mockResolvedValue({ data: fileData } as object);

    const result = await renameFile({ plainName: 'new-name', type: 'txt', fileUuid: 'file-uuid' });

    expect(result.data).toMatchObject(fileData);
    expect(result.error).toBe(undefined);
  });

  it('should log and return error when the request fails', async () => {
    const error = new DriveServerError('NOT_FOUND', 404);
    driveServerPutMock.mockResolvedValue({ data: undefined, error } as object);

    const result = await renameFile({ plainName: 'new-name', type: 'txt', fileUuid: 'file-uuid' });

    expect(result.error).toBe(error);
    call(loggerMock.error).toMatchObject({
      msg: 'Error renaming file',
      error,
      path: '/files/file-uuid/meta',
    });
  });
});
