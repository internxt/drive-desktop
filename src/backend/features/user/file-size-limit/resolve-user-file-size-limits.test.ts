import configStore from '@/apps/main/config';
import { type AuthContext } from '@/apps/sync-engine/config';
import * as getUserFileSizeLimitModule from '@/infra/drive-server-wip/services/files/get-user-file-size-limit';
import { loggerMock } from '@/tests/vitest/mocks.helper.test';
import { call, calls, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { resolveUserFileSizeLimit } from './resolve-user-file-size-limits';

describe('resolveUserFileSizeLimit', () => {
  const getUserFileSizeLimitMock = partialSpyOn(getUserFileSizeLimitModule, 'getUserFileSizeLimit');
  const configGetMock = partialSpyOn(configStore, 'get');
  const configSetMock = partialSpyOn(configStore, 'set');

  const ctx = {} as AuthContext;

  it('should store and return max upload file size from API', async () => {
    getUserFileSizeLimitMock.mockResolvedValue({ data: { maxUploadFileSize: 5 } });

    const res = await resolveUserFileSizeLimit({ ctx });

    expect(res).toStrictEqual({ data: { maxUploadFileSize: 5 } });
    call(getUserFileSizeLimitMock).toStrictEqual({ ctx });
    call(configSetMock).toStrictEqual(['maxUploadFileSizeInBytes', 5]);
    expect(configGetMock).not.toHaveBeenCalled();
    expect(loggerMock.debug).toHaveBeenCalledWith({
      tag: 'SYNC-ENGINE',
      msg: 'Resolved user file size limit from API',
      maxUploadFileSize: 5,
    });
  });

  it('should use stored max upload file size if API returns null', async () => {
    getUserFileSizeLimitMock.mockResolvedValue({ data: { maxUploadFileSize: null } });
    configGetMock.mockReturnValue(5);

    const res = await resolveUserFileSizeLimit({ ctx });

    expect(res).toStrictEqual({ data: { maxUploadFileSize: 5 } });
    call(configGetMock).toStrictEqual('maxUploadFileSizeInBytes');
    expect(configSetMock).not.toHaveBeenCalled();
    expect(loggerMock.warn).toHaveBeenCalledWith({
      tag: 'SYNC-ENGINE',
      msg: 'Using stored user file size limit because API Returned invalid value',
      maxUploadFileSize: 5,
    });
  });

  it('should use stored max upload file size if API returns error', async () => {
    const error = new Error('Request failed');
    getUserFileSizeLimitMock.mockResolvedValue({ error });
    configGetMock.mockReturnValue(5);

    const res = await resolveUserFileSizeLimit({ ctx });

    expect(res).toStrictEqual({ data: { maxUploadFileSize: 5 } });
    call(configGetMock).toStrictEqual('maxUploadFileSizeInBytes');
    calls(configSetMock).toHaveLength(0);
    expect(loggerMock.warn).toHaveBeenCalledWith({
      tag: 'SYNC-ENGINE',
      msg: 'Using stored user file size limit because API Returned invalid value',
      maxUploadFileSize: 5,
    });
  });

  it('should go blind if API and stored max upload file size are invalid', async () => {
    const error = new Error('Request failed');
    getUserFileSizeLimitMock.mockResolvedValue({ error });
    configGetMock.mockReturnValue(0);

    const res = await resolveUserFileSizeLimit({ ctx });

    expect(res).toStrictEqual({ error });
    call(configGetMock).toStrictEqual('maxUploadFileSizeInBytes');
    calls(configSetMock).toHaveLength(0);
    expect(loggerMock.warn).toHaveBeenCalledWith({
      tag: 'SYNC-ENGINE',
      msg: 'Unable to resolve user file size limit, relying on API validation',
      error,
    });
  });
});
