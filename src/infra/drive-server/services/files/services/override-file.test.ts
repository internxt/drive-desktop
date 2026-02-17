import { call, partialSpyOn } from 'tests/vitest/utils.helper';
import { loggerMock } from 'tests/vitest/mocks.helper';
import * as authServiceModule from '../../../../../apps/main/auth/service';
import { driveServerClient } from '../../../client/drive-server.client.instance';
import { DriveServerError } from '../../../drive-server.error';
import { overrideFile } from './override-file';

describe('overrideFile', () => {
  const driveServerPutMock = partialSpyOn(driveServerClient, 'PUT');
  const getNewApiHeadersMock = partialSpyOn(authServiceModule, 'getNewApiHeaders');

  beforeEach(() => {
    getNewApiHeadersMock.mockReturnValue({});
  });

  it('should return true when the request is successful', async () => {
    driveServerPutMock.mockResolvedValue({ data: {} } as object);

    const result = await overrideFile({ fileUuid: 'file-uuid', fileContentsId: 'contents-id', fileSize: 1024 });

    expect(result.data).toBe(true);
    expect(result.error).toBe(undefined);
  });

  it('should log and return error when the request fails', async () => {
    const error = new DriveServerError('SERVER_ERROR', 500);
    driveServerPutMock.mockResolvedValue({ data: undefined, error } as object);

    const result = await overrideFile({ fileUuid: 'file-uuid', fileContentsId: 'contents-id', fileSize: 1024 });

    expect(result.error).toBe(error);
    call(loggerMock.error).toMatchObject({
      msg: 'Error overriding file',
      error,
      path: '/files/file-uuid',
    });
  });
});
