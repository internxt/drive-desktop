import { AuthService } from './auth.service';
import { authClient } from './auth.client';
import {
  getBaseApiHeaders,
  getNewApiHeaders,
} from '../../../../apps/main/auth/service';
import { logger } from '../../../../core/LoggerService/LoggerService';
import { LoginAccessRequest, LoginAccessResponse, LoginResponse } from './auth.types';

jest.mock('../../../../apps/main/auth/service', () => ({
  getNewApiHeaders: jest.fn(),
  getBaseApiHeaders: jest.fn(),
}));

jest.mock('./auth.client', () => ({
  authClient: {
    GET: jest.fn(),
    POST: jest.fn(),
  },
}));

jest.mock('../../../../core/LoggerService/LoggerService', () => ({
  logger: {
    error: jest.fn(),
  },
}));

describe('AuthService', () => {
  let sut: AuthService;

  beforeEach(() => {
    sut = new AuthService();
    jest.clearAllMocks();
  });

  describe('refresh', () => {
    it('should return token and newToken when response is succesful', async () => {
      const data = { token: 'token', newToken: 'newToken' };
      (authClient.GET as jest.Mock).mockResolvedValue({ data });
      const mockedHeaders: Record<string, string> = {
        Authorization: 'Bearer newToken',
        'content-type': 'application/json; charset=utf-8',
        'internxt-client': 'drive-desktop',
        'internxt-version': '2.4.8',
        'x-internxt-desktop-header': 'test-header',
      };
      (getNewApiHeaders as jest.Mock).mockResolvedValue(mockedHeaders);
      const result = await sut.refresh();

      expect(result.isRight()).toEqual(true);
      expect(result.getRight()).toEqual(data);
      expect(authClient.GET).toHaveBeenCalledWith('/users/refresh', {
        headers: mockedHeaders,
      });
    });

    it('should return error when response is not successful', async () => {
      (authClient.GET as jest.Mock).mockResolvedValue({ data: undefined });

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
        })
      );
    });

    it('should return error when request throws an exception', async () => {
      const error = new Error('Request failed');
      (authClient.GET as jest.Mock).mockRejectedValue(error);

      const result = await sut.refresh();

      expect(result.isLeft()).toBe(true);
      expect(result.getLeft()).toEqual(error);

      expect(logger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          msg: 'Login request threw an exception',
          tag: 'AUTH',
          error: error,
          attributes: expect.objectContaining({
            endpoint: '/auth/login',
          }),
        })
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
      (authClient.POST as jest.Mock).mockResolvedValue({ data });
      const mockedHeaders: Record<string, string> = {
        Authorization: 'Bearer token',
        'content-type': 'application/json; charset=utf-8',
        'internxt-client': 'drive-desktop',
        'internxt-version': '2.4.8',
        'x-internxt-desktop-header': 'test-header',
      };
      (getBaseApiHeaders as jest.Mock).mockReturnValue(mockedHeaders);

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
      (authClient.POST as jest.Mock).mockResolvedValue({ data: undefined });
      (getBaseApiHeaders as jest.Mock).mockReturnValue({});

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
        })
      );
    });

    it('should return error when request throws an exception', async () => {
      const email = 'test@example.com';
      const error = new Error('Network error');
      (authClient.POST as jest.Mock).mockRejectedValue(error);
      (getBaseApiHeaders as jest.Mock).mockReturnValue({});

      const result = await sut.login(email);

      expect(result.isLeft()).toBe(true);
      expect(result.getLeft()).toEqual(error);

      expect(logger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          msg: 'Login request threw an exception',
          tag: 'AUTH',
          error: error,
          attributes: {
            endpoint: '/auth/login',
          },
        })
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

      // --- mock de la respuesta correcta ---
      const data: LoginAccessResponse = {
        user: {
          id: 'user-1',
          email: 'test@example.com',
          name: 'Test User',
        } as any,      // cast rápido; en tests no necesitamos todo el shape
        token: 'jwt-token',
        userTeam: {},  // tu API devuelve un objeto vacío
        newToken: 'refresh-jwt',
      };

      // --- mocks de dependencias ---
      (authClient.POST as jest.Mock).mockResolvedValue({ data });

      const mockedHeaders: Record<string, string> = {
        Authorization: 'Bearer token',
        'content-type': 'application/json; charset=utf-8',
        'internxt-client': 'drive-desktop',
        'internxt-version': '2.4.8',
        'x-internxt-desktop-header': 'test-header',
      };
      (getBaseApiHeaders as jest.Mock).mockReturnValue(mockedHeaders);

      // --- llamada al SUT ---
      const result = await sut.access(credentials);

      // --- aserciones ---
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

      (authClient.POST as jest.Mock).mockResolvedValue({ data: undefined });
      (getBaseApiHeaders as jest.Mock).mockReturnValue({});

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
      (authClient.POST as jest.Mock).mockRejectedValue(error);
      (getBaseApiHeaders as jest.Mock).mockReturnValue({});

      const result = await sut.access(credentials);

      expect(result.isLeft()).toBe(true);
      expect(result.getLeft()).toEqual(error);

      expect(logger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          msg: 'Access request threw an exception',
          tag: 'AUTH',
          error,
          attributes: expect.objectContaining({
            endpoint: '/auth/login/access',
          }),
        }),
      );
    });
  });

});
