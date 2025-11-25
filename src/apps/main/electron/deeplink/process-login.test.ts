import { call, calls, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { processLogin } from './process-login';
import * as authService from '../../auth/service';
import { DriveServerWipModule } from '@/infra/drive-server-wip/drive-server-wip.module';
import * as authHandlers from '../../auth/handlers';

describe('process-login', () => {
  const updateCredentialsMock = partialSpyOn(authService, 'updateCredentials');
  const refreshMock = partialSpyOn(DriveServerWipModule.auth, 'refresh');
  const setUserMock = partialSpyOn(authService, 'setUser');
  const restoreSavedConfigMock = partialSpyOn(authService, 'restoreSavedConfig');
  const setIsLoggedInMock = partialSpyOn(authHandlers, 'setIsLoggedIn');
  const emitUserLoggedInMock = partialSpyOn(authHandlers, 'emitUserLoggedIn');

  it('should process search params and login', async () => {
    // Given
    refreshMock.mockResolvedValue({ data: { user: { uuid: 'uuid' } } });
    // When
    await processLogin({ search: '?mnemonic=bW5lbW9uaWM=&newToken=bmV3VG9rZW4=&privateKey=cHJpdmF0ZUtleQ==' });
    // Then
    call(updateCredentialsMock).toStrictEqual({ newToken: 'newToken' });
    call(setUserMock).toStrictEqual({ uuid: 'uuid', privateKey: 'privateKey', mnemonic: 'mnemonic' });
    call(restoreSavedConfigMock).toStrictEqual({ uuid: 'uuid' });
    call(setIsLoggedInMock).toBe(true);
    calls(emitUserLoggedInMock).toHaveLength(1);
  });
});
