import { registerAuthIPCHandlers } from './auth-ipc-handlers';
import { AuthIPCMain } from './auth-ipc-main';
import { driveServerModule } from '../drive-server/drive-server.module';
import { LoginResponse } from '../drive-server/services/auth/auth.types';

jest.mock('../drive-server/drive-server.module', () => ({
  driveServerModule: {
    auth: {
      login: jest.fn(),
      access: jest.fn(),
    },
  },
}));

jest.mock('./auth-ipc-main', () => ({
  AuthIPCMain: {
    handle: jest.fn(),
  },
}));

describe('registerAuthIPCHandlers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('auth:login', () => {
    it('should register the auth:login handler', () => {
      registerAuthIPCHandlers();

      expect(AuthIPCMain.handle).toHaveBeenCalledWith(
        'auth:login',
        expect.any(Function)
      );
    });

    it('should return a successful response for auth:login', async () => {
      registerAuthIPCHandlers();
      const loginMock = driveServerModule.auth.login as jest.Mock;
      const response: LoginResponse = {
        hasKeys: true,
        sKey: 'test-sKey',
        tfa: false,
        hasKyberKeys: false,
        hasEccKeys: false,
      };
      loginMock.mockResolvedValueOnce({
        fold: (_onLeft: any, onRight: any) => onRight(response),
      });

      const handler = (AuthIPCMain.handle as jest.Mock).mock.calls.find(
        ([eventName]) => eventName === 'auth:login'
      )[1];

      const result = await handler({}, 'test@example.com');

      expect(result).toEqual({
        success: true,
        data: response,
      });
    });

    it('should return an error response for auth:login', async () => {
      registerAuthIPCHandlers();
      const loginMock = driveServerModule.auth.login as jest.Mock;
      loginMock.mockResolvedValueOnce({
        fold: (onLeft: any, _onRight: any) => onLeft(new Error('Login failed')),
      });

      const handler = (AuthIPCMain.handle as jest.Mock).mock.calls.find(
        ([eventName]) => eventName === 'auth:login'
      )[1];

      const result = await handler({}, 'test@example.com');

      expect(result).toEqual({
        success: false,
        error: 'Login failed',
      });
    });
  });

  describe('auth:access', () => {
    it('should register the auth:access handler', () => {
      registerAuthIPCHandlers();
      expect(AuthIPCMain.handle).toHaveBeenCalledWith(
        'auth:access',
        expect.any(Function)
      );
    });

    it('should return a successful response for auth:access', async () => {
      registerAuthIPCHandlers();
      const accessMock = driveServerModule.auth.access as jest.Mock;
      const mockAccessData = { sessionId: 'abc123' };
      accessMock.mockResolvedValueOnce({
        fold: (_onLeft: any, onRight: any) => onRight(mockAccessData),
      });

      const handler = (AuthIPCMain.handle as jest.Mock).mock.calls.find(
        ([eventName]) => eventName === 'auth:access'
      )[1];

      const result = await handler(
        {},
        { email: 'test@example.com', code: '123456' }
      );

      expect(result).toEqual({
        success: true,
        data: mockAccessData,
      });
    });

    it('should return an error response for auth:access', async () => {
      registerAuthIPCHandlers();
      const accessMock = driveServerModule.auth.access as jest.Mock;
      accessMock.mockResolvedValueOnce({
        fold: (onLeft: any, _onRight: any) =>
          onLeft(new Error('Access denied')),
      });

      const handler = (AuthIPCMain.handle as jest.Mock).mock.calls.find(
        ([eventName]) => eventName === 'auth:access'
      )[1];

      const result = await handler(
        {},
        { email: 'test@example.com', code: '123456' }
      );

      expect(result).toEqual({
        success: false,
        error: 'Access denied',
      });
    });
  });
});
