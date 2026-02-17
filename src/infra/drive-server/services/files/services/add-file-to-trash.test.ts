import { call, partialSpyOn } from 'tests/vitest/utils.helper';
import { loggerMock } from 'tests/vitest/mocks.helper';
import * as authServiceModule from '../../../../../apps/main/auth/service';
import { driveServerClient } from '../../../client/drive-server.client.instance';
import { DriveServerError } from '../../../drive-server.error';
import { addFileToTrash } from './add-file-to-trash';

describe('addFileToTrash', () => {
  const driveServerPostMock = partialSpyOn(driveServerClient, 'POST');
  const getNewApiHeadersMock = partialSpyOn(authServiceModule, 'getNewApiHeaders');

  beforeEach(() => {
    getNewApiHeadersMock.mockReturnValue({});
  });

  it('should return true when the request is successful', async () => {
    driveServerPostMock.mockResolvedValue({ data: {} } as object);

    const result = await addFileToTrash('file-uuid');

    expect(result.data).toBe(true);
    expect(result.error).toBe(undefined);
  });

  it('should log and return error when the request fails', async () => {
    const error = new DriveServerError('BAD_REQUEST', 400);
    driveServerPostMock.mockResolvedValue({ data: undefined, error } as object);

    const result = await addFileToTrash('file-uuid');

    expect(result.error).toBe(error);
    call(loggerMock.error).toMatchObject({
      msg: 'Error adding file to trash',
      error,
      path: '/storage/trash/add',
    });
  });
});
