import { partialSpyOn } from 'tests/vitest/utils.helper';

import { driveServerClient } from '../../../client/drive-server.client.instance';
import { DriveServerError } from '../../../drive-server.error';

import { getUserFileSizeLimit } from './get-user-file-size-limit';

describe('getUserFileSizeLimit', () => {
  const driveServerGetMock = partialSpyOn(driveServerClient, 'GET');

  it('should call GET /files/limits', async () => {
    driveServerGetMock.mockResolvedValue({ data: { maxUploadFileSize: 1024, versioning: {} } } as object);

    await getUserFileSizeLimit();

    expect(driveServerGetMock).toHaveBeenCalledWith('/files/limits');
  });

  it('should return only maxUploadFileSize when the request is successful', async () => {
    driveServerGetMock.mockResolvedValue({ data: { maxUploadFileSize: 1024, versioning: {} } } as object);

    const result = await getUserFileSizeLimit();

    expect(result.data).toBe(1024);
    expect(result.error).toBeUndefined();
  });

  it('should preserve null maxUploadFileSize from the API response', async () => {
    driveServerGetMock.mockResolvedValue({ data: { maxUploadFileSize: null, versioning: {} } } as object);

    const result = await getUserFileSizeLimit();

    expect(result.data).toBe(null);
    expect(result.error).toBeUndefined();
  });

  it('should return error when the request fails', async () => {
    const error = new DriveServerError('NETWORK_ERROR', 500);
    driveServerGetMock.mockResolvedValue({ data: undefined, error } as object);

    const result = await getUserFileSizeLimit();

    expect(result.error).toBe(error);
    expect(result.data).toBeUndefined();
  });
});
