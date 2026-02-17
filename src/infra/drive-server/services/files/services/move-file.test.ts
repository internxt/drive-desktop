import { call, partialSpyOn } from 'tests/vitest/utils.helper';
import { loggerMock } from 'tests/vitest/mocks.helper';
import * as authServiceModule from '../../../../../apps/main/auth/service';
import { driveServerClient } from '../../../client/drive-server.client.instance';
import { DriveServerError } from '../../../drive-server.error';

import { moveFile } from './move-file';

describe('moveFile', () => {
  const driveServerPatchMock = partialSpyOn(driveServerClient, 'PATCH');
  const getNewApiHeadersMock = partialSpyOn(authServiceModule, 'getNewApiHeaders');

  beforeEach(() => {
    getNewApiHeadersMock.mockReturnValue({});
  });

  it('should return true when the request is successful', async () => {
    driveServerPatchMock.mockResolvedValue({ data: {} } as object);

    const result = await moveFile({ destinationFolder: 'folder-uuid', uuid: 'file-uuid' });

    expect(result.data).toBe(true);
    expect(result.error).toBe(undefined);
  });

  it('should log and return error when the request fails', async () => {
    const error = new DriveServerError('NOT_FOUND', 404);
    driveServerPatchMock.mockResolvedValue({ data: undefined, error } as object);

    const result = await moveFile({ destinationFolder: 'folder-uuid', uuid: 'file-uuid' });

    expect(result.error).toBe(error);
    call(loggerMock.error).toMatchObject({
      msg: 'Error moving file',
      error,
      path: '/files/file-uuid',
    });
  });
});
