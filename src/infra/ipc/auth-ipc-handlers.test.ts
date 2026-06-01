import { IpcMainEvent } from 'electron';
import { registerAuthIPCHandlers } from './auth-ipc-handlers';
import { AuthIPCMain } from './auth-ipc-main';
import { driveServerModule } from '../drive-server/drive-server.module';
import { LoginAccessResponse, LoginResponse } from '../drive-server/services/auth/auth.types';
import { partialSpyOn } from 'tests/vitest/utils.helper';

describe('registerAuthIPCHandlers', () => {
  const loginMock = partialSpyOn(driveServerModule.auth, 'login');
  const accessMock = partialSpyOn(driveServerModule.auth, 'access');
  const authIPCMainHandleMock = partialSpyOn(AuthIPCMain, 'handle');

  function getHandler(eventName: string) {
    registerAuthIPCHandlers();
    const call = authIPCMainHandleMock.mock.calls.find(([name]) => name === eventName);
    if (!call) throw new Error(`Handler for '${eventName}' not registered`);
    return call[1];
  }

  describe('auth:login', () => {
    it('should register the auth:login handler', () => {
      registerAuthIPCHandlers();

      expect(authIPCMainHandleMock).toBeCalledWith('auth:login', expect.any(Function));
    });

    it('should return a successful response for auth:login', async () => {
      const response: LoginResponse = {
        hasKeys: true,
        sKey: 'test-sKey',
        tfa: false,
        hasKyberKeys: false,
        hasEccKeys: false,
      };
      loginMock.mockResolvedValueOnce({
        fold: <T>(_onLeft: (err: Error) => T, onRight: (data: LoginResponse) => T): T => onRight(response),
      });

      const handler = getHandler('auth:login');
      const result = await handler({} as IpcMainEvent, 'test@example.com');

      expect(result).toStrictEqual({
        success: true,
        data: response,
      });
    });

    it('should return an error response for auth:login', async () => {
      loginMock.mockResolvedValueOnce({
        fold: <T>(onLeft: (err: Error) => T, _onRight: (data: LoginResponse) => T): T =>
          onLeft(new Error('Login failed')),
      });

      const handler = getHandler('auth:login');
      const result = await handler({} as IpcMainEvent, 'test@example.com');

      expect(result).toStrictEqual({
        success: false,
        error: 'Login failed',
      });
    });
  });

  describe('auth:access', () => {
    it('should register the auth:access handler', () => {
      registerAuthIPCHandlers();
      expect(authIPCMainHandleMock).toBeCalledWith('auth:access', expect.any(Function));
    });

    it('should return a successful response for auth:access', async () => {
      const mockAccessData = { sessionId: 'abc123' } as unknown as LoginAccessResponse;
      accessMock.mockResolvedValueOnce({
        fold: <T>(_onLeft: (err: Error) => T, onRight: (data: LoginAccessResponse) => T): T => onRight(mockAccessData),
      });

      const handler = getHandler('auth:access');
      const result = await handler({} as IpcMainEvent, { email: 'test@example.com', password: '123456' });

      expect(result).toStrictEqual({
        success: true,
        data: mockAccessData,
      });
    });

    it('should return an error response for auth:access', async () => {
      accessMock.mockResolvedValueOnce({
        fold: <T>(onLeft: (err: Error) => T, _onRight: (data: LoginAccessResponse) => T): T =>
          onLeft(new Error('Access denied')),
      });

      const handler = getHandler('auth:access');
      const result = await handler({} as IpcMainEvent, { email: 'test@example.com', password: '123456' });

      expect(result).toStrictEqual({
        success: false,
        error: 'Access denied',
      });
    });
  });
});
