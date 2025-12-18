import { AuthService } from './auth.service';
import { authClient } from './auth.client';
import { getBaseApiHeaders, getNewApiHeaders } from '../../../../apps/main/auth/service';
import { LoginAccessRequest, LoginAccessResponse, LoginResponse } from './auth.types';
import { logger } from '@internxt/drive-desktop-core/build/backend';
import { Mock } from 'vitest';
vi.mock('axios', async (importOriginal) => {
  const actual = await importOriginal<typeof import('axios')>();
  return {
    ...actual,
    isAxiosError: vi.fn(),
  };
});

vi.mock('@internxt/drive-desktop-core/build/backend', () => ({
  logger: {
    error: vi.fn(),
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
}));

vi.mock('../../../../apps/main/auth/service', () => ({
  getNewApiHeaders: vi.fn(),
  getBaseApiHeaders: vi.fn(),
}));

vi.mock('./auth.client', () => ({
  authClient: {
    GET: vi.fn(),
    POST: vi.fn(),
  },
}));

describe('AuthService', () => {
  let sut: AuthService;

  beforeEach(() => {
    sut = new AuthService();
    vi.clearAllMocks();
  });

  describe('refresh', () => {
    it('should return token and newToken when response is succesful', async () => {
      const data = { token: 'token', newToken: 'newToken' };
      (authClient.GET as Mock).mockResolvedValue({ data });
      const mockedHeaders: Record<string, string> = {
        Authorization: 'Bearer newToken',
        'content-type': 'application/json; charset=utf-8',
        'internxt-client': 'drive-desktop',
        'internxt-version': '2.4.8',
        'x-internxt-desktop-header': 'test-header',
      };
      (getNewApiHeaders as Mock).mockResolvedValue(mockedHeaders);
      const result = await sut.refresh();

      expect(result.isRight()).toEqual(true);
      expect(result.getRight()).toEqual(data);
      expect(authClient.GET).toHaveBeenCalledWith('/users/refresh', {
        headers: mockedHeaders,
      });
    });

    it('should return error when response is not successful', async () => {
      (authClient.GET as Mock).mockResolvedValue({ data: undefined });

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
      (authClient.GET as Mock).mockRejectedValue(error);

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
      (authClient.POST as Mock).mockResolvedValue({ data });
      const mockedHeaders: Record<string, string> = {
        Authorization: 'Bearer token',
        'content-type': 'application/json; charset=utf-8',
        'internxt-client': 'drive-desktop',
        'internxt-version': '2.4.8',
        'x-internxt-desktop-header': 'test-header',
      };
      (getBaseApiHeaders as Mock).mockReturnValue(mockedHeaders);

      const result = await sut.login(email);

      expect(result.isRight()).toBe(true);
      expect(result.getRight()).toEqual(data);
      expect(authClient.POST).toHaveBeenCalledWith('/auth/login', {
        body: { email },
        headers: mockedHeaders,
      });
    });

    it('should return error when request is not successful', async () => {
      const email = 'test@example.com';
      (authClient.POST as Mock).mockResolvedValue({ data: undefined });
      (getBaseApiHeaders as Mock).mockReturnValue({});

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
      (authClient.POST as Mock).mockRejectedValue(error);
      (getBaseApiHeaders as Mock).mockReturnValue({});

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

      const data: LoginAccessResponse = {
        user: {
          id: 'user-1',
          email: 'test@example.com',
          name: 'Test User',
        } as any,
        token: 'jwt-token',
        userTeam: {},
        newToken: 'refresh-jwt',
      };

      (authClient.POST as Mock).mockResolvedValue({ data });

      const mockedHeaders: Record<string, string> = {
        Authorization: 'Bearer token',
        'content-type': 'application/json; charset=utf-8',
        'internxt-client': 'drive-desktop',
        'internxt-version': '2.4.8',
        'x-internxt-desktop-header': 'test-header',
      };
      (getBaseApiHeaders as Mock).mockReturnValue(mockedHeaders);

      const result = await sut.access(credentials);

      expect(result.isRight()).toBe(true);
      expect(result.getRight()).toEqual(data);
      expect(authClient.POST).toHaveBeenCalledWith('/auth/login/access', {
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

      (authClient.POST as Mock).mockResolvedValue({ data: undefined });
      (getBaseApiHeaders as Mock).mockReturnValue({});

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
      (authClient.POST as Mock).mockRejectedValue(error);
      (getBaseApiHeaders as Mock).mockReturnValue({});

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
