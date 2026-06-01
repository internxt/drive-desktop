import { AuthService } from './auth.service';
import * as authClientModule from './auth.client';
import * as authServiceModule from '../../../../apps/main/auth/service';
import { LoginAccessRequest, LoginAccessResponse, LoginResponse } from './auth.types';
import { logger } from '@internxt/drive-desktop-core/build/backend';
import { partialSpyOn } from 'tests/vitest/utils.helper';
import { MockInstance } from 'vitest';

vi.mock('axios', async (importOriginal) => {
  const actual = await importOriginal<typeof import('axios')>();
  return {
    ...actual,
    isAxiosError: vi.fn(),
  };
});

vi.mock('../../drive-server.module', () => ({
  driveServerModule: {
    auth: {},
    backup: {},
    user: {},
  },
  DriveServerModule: vi.fn(),
}));

describe('AuthService', () => {
  let sut: AuthService;
  const getNewApiHeadersMock = partialSpyOn(authServiceModule, 'getNewApiHeaders');
  const getBaseApiHeadersMock = partialSpyOn(authServiceModule, 'getBaseApiHeaders');
  const authGetMock = partialSpyOn(authClientModule.authClient, 'GET') as unknown as MockInstance;
  const authPostMock = partialSpyOn(authClientModule.authClient, 'POST') as unknown as MockInstance;

  beforeEach(() => {
    sut = new AuthService();
  });

  describe('refresh', () => {
    it('should return token and newToken when response is succesful', async () => {
      const data = { token: 'token', newToken: 'newToken' };
      authGetMock.mockResolvedValue({ data });
      const mockedHeaders: Record<string, string> = {
        Authorization: 'Bearer newToken',
        'content-type': 'application/json; charset=utf-8',
        'internxt-client': 'drive-desktop',
        'internxt-version': '2.4.8',
        'x-internxt-desktop-header': 'test-header',
      };
      getNewApiHeadersMock.mockReturnValue(mockedHeaders);
      const result = await sut.refresh();

      expect(result.isRight()).toEqual(true);
      expect(result.getRight()).toEqual(data);
      expect(authGetMock).toHaveBeenCalledWith('/users/refresh', {
        headers: mockedHeaders,
      });
    });

    it('should return error when response is not successful', async () => {
      authGetMock.mockResolvedValue({ data: undefined });

      const result = await sut.refresh();

      expect(result.isLeft()).toBe(true);

      const error = result.getLeft();
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe('Refresh request was not successful');

      expect(logger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          msg: 'Refresh request was not successful',
          tag: 'AUTH',
          attributes: expect.objectContaining({
            endpoint: '/users/refresh',
          }),
        }),
      );
    });

    it('should return error when request throws an exception', async () => {
      const error = new Error('Request failed');
      authGetMock.mockRejectedValue(error);

      const result = await sut.refresh();

      expect(result.isLeft()).toBe(true);
      expect(result.getLeft()).toEqual(error);

      expect(logger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          msg: 'Login request threw an exception',
          tag: 'AUTH',
          error: 'Request failed',
          attributes: expect.objectContaining({
            endpoint: '/auth/login',
          }),
        }),
      );
    });
  });

  describe('login', () => {
    it('should return the proper LoginResponse when request is successful', async () => {
      const email = 'test@example.com';
      const data: LoginResponse = {
        hasKeys: true,
        sKey: 'sKey',
        tfa: false,
        hasKyberKeys: false,
        hasEccKeys: false,
      };
      authPostMock.mockResolvedValue({ data });
      const mockedHeaders: Record<string, string> = {
        Authorization: 'Bearer token',
        'content-type': 'application/json; charset=utf-8',
        'internxt-client': 'drive-desktop',
        'internxt-version': '2.4.8',
        'x-internxt-desktop-header': 'test-header',
      };
      getBaseApiHeadersMock.mockReturnValue(mockedHeaders);

      const result = await sut.login(email);

      expect(result.isRight()).toBe(true);
      expect(result.getRight()).toEqual(data);
      expect(authPostMock).toHaveBeenCalledWith('/auth/login', {
        body: { email },
        headers: mockedHeaders,
      });
    });

    it('should return error when request is not successful', async () => {
      const email = 'test@example.com';
      authPostMock.mockResolvedValue({ data: undefined });
      getBaseApiHeadersMock.mockReturnValue({});
      const result = await sut.login(email);

      expect(result.isLeft()).toBe(true);
      const error = result.getLeft();
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe('Login request was not successful');

      expect(logger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          msg: 'Login request was not successful',
          tag: 'AUTH',
          attributes: {
            endpoint: '/auth/login',
          },
        }),
      );
    });

    it('should return error when request throws an exception', async () => {
      const email = 'test@example.com';
      const error = new Error('Network error');
      authPostMock.mockRejectedValue(error);
      getBaseApiHeadersMock.mockReturnValue({});

      const result = await sut.login(email);

      expect(result.isLeft()).toBe(true);
      expect(result.getLeft()).toEqual(error);

      expect(logger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          msg: 'Login request threw an exception',
          tag: 'AUTH',
          error: 'Network error',
          attributes: {
            endpoint: '/auth/login',
          },
        }),
      );
    });
  });

  describe('access', () => {
    it('should return the proper LoginAccessResponse when request is successful', async () => {
      const credentials: LoginAccessRequest = {
        email: 'test@example.com',
        password: 'password',
        tfa: '123456',
      };

      const data = {
        user: {
          email: 'test@example.com',
          name: 'Test User',
        },
        token: 'jwt-token',
        userTeam: {},
        newToken: 'refresh-jwt',
      } as unknown as LoginAccessResponse;

      authPostMock.mockResolvedValue({ data });

      const mockedHeaders: Record<string, string> = {
        Authorization: 'Bearer token',
        'content-type': 'application/json; charset=utf-8',
        'internxt-client': 'drive-desktop',
        'internxt-version': '2.4.8',
        'x-internxt-desktop-header': 'test-header',
      };
      getBaseApiHeadersMock.mockReturnValue(mockedHeaders);

      const result = await sut.access(credentials);

      expect(result.isRight()).toBe(true);
      expect(result.getRight()).toEqual(data);
      expect(authPostMock).toHaveBeenCalledWith('/auth/login/access', {
        body: credentials,
        headers: mockedHeaders,
      });
    });

    it('should return error when request is not successful', async () => {
      const credentials: LoginAccessRequest = {
        email: 'test@example.com',
        password: 'password',
        tfa: '123456',
      };

      authPostMock.mockResolvedValue({ data: undefined });
      getBaseApiHeadersMock.mockReturnValue({});

      const result = await sut.access(credentials);

      expect(result.isLeft()).toBe(true);
      const error = result.getLeft();
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe('Access request was not successful');

      expect(logger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          msg: 'Access request was not successful',
          tag: 'AUTH',
          attributes: expect.objectContaining({
            endpoint: '/auth/login/access',
          }),
        }),
      );
    });

    it('should return error when request throws an exception', async () => {
      const credentials: LoginAccessRequest = {
        email: 'test@example.com',
        password: 'password',
        tfa: '123456',
      };

      const error = new Error('Network error');
      authPostMock.mockRejectedValue(error);
      getBaseApiHeadersMock.mockReturnValue({});

      const result = await sut.access(credentials);

      expect(result.isLeft()).toBe(true);
      expect(result.getLeft()).toEqual(error);

      expect(logger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          msg: 'Access request threw an exception',
          tag: 'AUTH',
          error: 'Network error',
          attributes: expect.objectContaining({
            endpoint: '/auth/login/access',
          }),
        }),
      );
    });
  });
});
