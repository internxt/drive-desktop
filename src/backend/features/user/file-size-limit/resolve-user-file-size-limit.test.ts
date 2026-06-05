import { loggerMock } from '../../../../../tests/vitest/mocks.helper';
import { partialSpyOn, call } from '../../../../../tests/vitest/utils.helper';
import configStore from '../../../../apps/main/config';
import { DriveServerError } from '../../../../infra/drive-server/drive-server.error';
import * as getUserFileSizeLimitModule from '../../../../infra/drive-server/services/files/services/get-user-file-size-limit';
import { resolveUserFileSizeLimit } from './resolve-user-file-size-limit';

describe('resolveUserFileSizeLimit', () => {
  const getUserFileSizeLimitMock = partialSpyOn(getUserFileSizeLimitModule, 'getUserFileSizeLimit');
  const configGetMock = partialSpyOn(configStore, 'get');
  const configSetMock = partialSpyOn(configStore, 'set');

  it('should return and store a fresh valid user file size limit', async () => {
    getUserFileSizeLimitMock.mockResolvedValue({ data: 1024 });

    const result = await resolveUserFileSizeLimit();

    expect(result).toStrictEqual({
      data: 1024,
    });
    call(configSetMock).toStrictEqual(['maxUploadFileSizeInBytes', 1024]);
    call(loggerMock.debug).toMatchObject({
      tag: 'SYNC-ENGINE',
      msg: 'Resolved user file size limit from API',
    });
  });

  it('should return stored limit when fresh request fails', async () => {
    getUserFileSizeLimitMock.mockResolvedValue({ error: new DriveServerError('NETWORK_ERROR', 500, 'Network error') });
    configGetMock.mockReturnValue(1024);

    const result = await resolveUserFileSizeLimit();

    expect(result).toStrictEqual({
      data: 1024,
    });
    expect(configSetMock).not.toBeCalled();
    call(loggerMock.warn).toMatchObject({
      tag: 'SYNC-ENGINE',
      msg: 'Using stored user file size limit',
    });
  });

  it('should return stored limit when fresh limit is invalid', async () => {
    getUserFileSizeLimitMock.mockResolvedValue({ data: 0 });
    configGetMock.mockReturnValue(1024);

    const result = await resolveUserFileSizeLimit();

    expect(result).toStrictEqual({
      data: 1024,
    });
    expect(configSetMock).not.toBeCalled();
  });

  it('should not return invalid stored limit', async () => {
    const error = new DriveServerError('NETWORK_ERROR', 500, 'Network error');
    getUserFileSizeLimitMock.mockResolvedValue({ error });
    configGetMock.mockReturnValue(0);

    const result = await resolveUserFileSizeLimit();

    expect(result.error).toBe(error);
    expect(result.data).toBeUndefined();
  });
});
