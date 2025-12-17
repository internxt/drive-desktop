import { UserService } from './user.service';
import { driveServerClient } from '../../client/drive-server.client.instance';
import { getNewApiHeaders } from '../../../../apps/main/auth/service';
import { logger } from '@internxt/drive-desktop-core/build/backend';
import { mapError } from '../utils/mapError';
import { Mock } from 'vitest';

vi.mock('../../client/drive-server.client.instance', () => ({
  driveServerClient: {
    GET: vi.fn(),
  },
}));

vi.mock('../../../../apps/main/auth/service', () => ({
  getNewApiHeaders: vi.fn(),
}));

vi.mock('@internxt/drive-desktop-core/build/backend', () => ({
  logger: {
    error: vi.fn(),
  },
}));

vi.mock('../utils/mapError', () => ({
  mapError: vi.fn(),
}));

describe('UserService', () => {
  let sut: UserService;

  beforeEach(() => {
    sut = new UserService();
    vi.clearAllMocks();
  });

  describe('getUsage', () => {
    it('should return usage data when response is successful', async () => {
      const usageData = {
        driveUsage: 1024,
        backupsUsage: 512,
        photosUsage: 256,
      };
      (driveServerClient.GET as Mock).mockResolvedValue({ data: usageData });
      const mockedHeaders = {
        Authorization: 'Bearer token',
        'content-type': 'application/json; charset=utf-8',
      };
      (getNewApiHeaders as Mock).mockReturnValue(mockedHeaders);

      const result = await sut.getUsage();

      expect(result.isRight()).toBe(true);
      expect(result.getRight()).toEqual(usageData);
      expect(driveServerClient.GET).toHaveBeenCalledWith('/users/usage', {
        headers: mockedHeaders,
      });
    });

    it('should return error when response is not successful', async () => {
      (driveServerClient.GET as Mock).mockResolvedValue({ data: undefined });
      const mockError = new Error('Get usage request was not successful');
      (logger.error as Mock).mockReturnValue(mockError);

      const result = await sut.getUsage();

      expect(result.isLeft()).toBe(true);
      expect(result.getLeft()).toBe(mockError);
      expect(logger.error).toHaveBeenCalledWith({
        msg: 'Get usage request was not successful',
        attributes: { endpoint: '/users/usage' },
      });
    });

    it('should return error when request throws an exception', async () => {
      const originalError = new Error('Network error');
      (driveServerClient.GET as Mock).mockRejectedValue(originalError);
      const mappedError = new Error('Mapped network error');
      (mapError as Mock).mockReturnValue(mappedError);
      const loggerError = new Error('Logger error');
      (logger.error as Mock).mockReturnValue(loggerError);

      const result = await sut.getUsage();

      expect(result.isLeft()).toBe(true);
      expect(result.getLeft()).toBe(loggerError);
      expect(mapError).toHaveBeenCalledWith(originalError);
      expect(logger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          msg: 'Get usage request threw an exception',
          attributes: { endpoint: '/users/usage' },
          error: 'Mapped network error',
        })
      );
    });
  });
  describe('getLimit', () => {
    it('should return limit data when response is successful', async () => {
      const limitData = {
        maxSpaceBytes: 1073741824,
        maxBackupDevices: 5,
        maxPhotos: 1000,
      };
      (driveServerClient.GET as Mock).mockResolvedValue({ data: limitData });
      const mockedHeaders = {
        Authorization: 'Bearer token',
        'content-type': 'application/json; charset=utf-8',
      };
      (getNewApiHeaders as Mock).mockReturnValue(mockedHeaders);

      const result = await sut.getLimit();

      expect(result.isRight()).toBe(true);
      expect(result.getRight()).toEqual(limitData);
      expect(driveServerClient.GET).toHaveBeenCalledWith('/users/limit', {
        headers: mockedHeaders,
      });
    });

    it('should return error when response is not successful', async () => {
      (driveServerClient.GET as Mock).mockResolvedValue({ data: undefined });
      const mockError = new Error('Get limit request was not successful');
      (logger.error as Mock).mockReturnValue(mockError);

      const result = await sut.getLimit();

      expect(result.isLeft()).toBe(true);
      expect(result.getLeft()).toBe(mockError);
      expect(logger.error).toHaveBeenCalledWith({
        msg: 'Get limit request was not successful',
        attributes: { endpoint: '/users/limit' },
      });
    });

    it('should return error when request throws an exception', async () => {
      const originalError = new Error('Network error');
      (driveServerClient.GET as Mock).mockRejectedValue(originalError);
      const mappedError = new Error('Mapped network error');
      (mapError as Mock).mockReturnValue(mappedError);
      const loggerError = new Error('Logger error');
      (logger.error as Mock).mockReturnValue(loggerError);

      const result = await sut.getLimit();

      expect(result.isLeft()).toBe(true);
      expect(result.getLeft()).toBe(loggerError);
      expect(mapError).toHaveBeenCalledWith(originalError);
      expect(logger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          msg: 'Get limit request threw an exception',
          attributes: { endpoint: '/users/limit' },
          error: 'Mapped network error',
        })
      );
    });
  });
});
