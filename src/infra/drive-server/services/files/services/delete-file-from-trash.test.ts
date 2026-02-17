import { call, partialSpyOn } from 'tests/vitest/utils.helper';
import { loggerMock } from 'tests/vitest/mocks.helper';
import * as authServiceModule from '../../../../../apps/main/auth/service';
import { driveServerClient } from '../../../client/drive-server.client.instance';
import { DriveServerError } from '../../../drive-server.error';
import { deleteFileFromTrash } from './delete-file-from-trash';

describe('deleteFileFromTrash', () => {
  const driveServerDeleteMock = partialSpyOn(driveServerClient, 'DELETE');
  const getNewApiHeadersMock = partialSpyOn(authServiceModule, 'getNewApiHeaders');

  beforeEach(() => {
    getNewApiHeadersMock.mockReturnValue({});
  });

  it('should return true when the request is successful', async () => {
    driveServerDeleteMock.mockResolvedValue({ data: {} } as object);

    const result = await deleteFileFromTrash('file-id');

    expect(result.data).toBe(true);
    expect(result.error).toBe(undefined);
  });

  it('should log and return error when the request fails', async () => {
    const error = new DriveServerError('NOT_FOUND', 404);
    driveServerDeleteMock.mockResolvedValue({ data: undefined, error } as object);

    const result = await deleteFileFromTrash('file-id');

    expect(result.error).toBe(error);
    call(loggerMock.error).toMatchObject({
      msg: 'Error deleting file from trash',
      error,
      path: '/storage/trash/file/file-id',
    });
  });
});
