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

  const mnemonic = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
  const base64Mnemonic = Buffer.from(mnemonic, 'utf8').toString('base64');

  it('should throw error if mnemonic is invalid', async () => {
    // Given
    refreshMock.mockResolvedValue({ data: { user: { uuid: 'uuid' } } });
    // When
    const promise = processLogin({ search: '?mnemonic=bW5lbW9uaWM=&newToken=bmV3VG9rZW4=&privateKey=cHJpdmF0ZUtleQ==' });
    // Then
    await expect(promise).rejects.toThrowError('Invalid mnemonic: mnemonic');
  });

  it('should process search params and login', async () => {
    // Given
    refreshMock.mockResolvedValue({ data: { newToken: 'refreshToken', user: { uuid: 'uuid' } } });
    // When
    await processLogin({ search: `?mnemonic=${base64Mnemonic}&newToken=bmV3VG9rZW4=&privateKey=cHJpdmF0ZUtleQ==` });
    // Then
    calls(updateCredentialsMock).toStrictEqual([{ newToken: 'newToken' }, { newToken: 'refreshToken' }]);
    call(setUserMock).toStrictEqual({ uuid: 'uuid', privateKey: 'privateKey', mnemonic });
    call(restoreSavedConfigMock).toStrictEqual({ uuid: 'uuid' });
    call(setIsLoggedInMock).toBe(true);
    calls(emitUserLoggedInMock).toHaveLength(1);
  });
});
