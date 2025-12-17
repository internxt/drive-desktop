import { BackupService } from './backup.service';
import { driveServerClient } from '../../client/drive-server.client.instance';
import { logger } from '@internxt/drive-desktop-core/build/backend';
import { Mock } from 'vitest';
import { mapError } from '../utils/mapError';

vi.mock('axios', async (importOriginal) => {
  const actual = await importOriginal<typeof import('axios')>();
  return {
    ...actual,
    isAxiosError: vi.fn(),
  };
});

vi.mock('../utils/mapError', () => ({
  mapError: vi.fn(),
}));

vi.mock('@internxt/drive-desktop-core/build/backend', () => ({
  logger: {
    error: vi.fn(),
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
}));

vi.mock('../../client/drive-server.client.instance', () => ({
  driveServerClient: {
    GET: vi.fn(),
    POST: vi.fn(),
    PATCH: vi.fn(),
  },
}));

vi.mock('../../../../apps/main/auth/service', () => ({
  getNewApiHeaders: vi.fn(() => ({})),
}));

describe('BackupService', () => {
  let sut: BackupService;

  beforeEach(() => {
    sut = new BackupService();
    vi.clearAllMocks();
    // Default mock behavior: mapError returns the error as an Error instance
    vi.mocked(mapError).mockImplementation((error) =>
      error instanceof Error ? error : new Error(String(error))
    );
  });

  describe('getDevices', () => {
    it('should return a list of devices when the response is successful', async () => {
      const data = [{ uuid: '123', name: 'Device 1' }];
      (driveServerClient.GET as Mock).mockResolvedValue({ data });

      const result = await sut.getDevices();

      expect(result.isRight()).toBe(true);
      expect(result.getRight()).toEqual(data);
    });

    it('should return an error when response is not successful', async () => {
      (driveServerClient.GET as Mock).mockResolvedValue({ data: undefined });

      const result = await sut.getDevices();

      expect(result.isLeft()).toBe(true);
      expect(result.getLeft()).toBeInstanceOf(Error);
      expect(logger.error).toHaveBeenCalled();
    });

    it('should return an error when the request throws an exception', async () => {
      const error = new Error('Request failed');
      (driveServerClient.GET as Mock).mockRejectedValue(error);

      const result = await sut.getDevices();

      expect(result.isLeft()).toBe(true);
      expect(result.getLeft()).toEqual(error);
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('getDevice', () => {
    it('should return a device when the response is successful', async () => {
      const data = { uuid: '123', name: 'Device A' };
      (driveServerClient.GET as Mock).mockResolvedValue({ data });

      const result = await sut.getDevice('123');

      expect(result.isRight()).toBe(true);
      expect(result.getRight()).toEqual(data);
    });

    it('should return an error when response is not successful', async () => {
      (driveServerClient.GET as Mock).mockResolvedValue({ data: undefined });

      const result = await sut.getDevice('123');

      expect(result.isLeft()).toBe(true);
      expect(logger.error).toHaveBeenCalled();
    });

    it('should return an error when the request throws an exception', async () => {
      const error = new Error('Error fetching device');
      (driveServerClient.GET as Mock).mockRejectedValue(error);

      const result = await sut.getDevice('123');

      expect(result.isLeft()).toBe(true);
      expect(result.getLeft()).toEqual(error);
    });
  });

  describe('getDeviceById', () => {
    it('should get a device by id and return it when the response is successful', async () => {
      const data = { uuid: 'id-123', name: 'Device B' };
      (driveServerClient.GET as Mock).mockResolvedValue({ data });

      const result = await sut.getDeviceById('id-123');

      expect(result.isRight()).toBe(true);
      expect(result.getRight()).toEqual(data);
    });

    it('should return an error when response is not successful', async () => {
      (driveServerClient.GET as Mock).mockResolvedValue({ data: undefined });

      const result = await sut.getDeviceById('id-123');

      expect(result.isLeft()).toBe(true);
      expect(logger.error).toHaveBeenCalled();
    });

    it('should return an error when the request throws an exception', async () => {
      const error = new Error('Exception occurred');
      (driveServerClient.GET as Mock).mockRejectedValue(error);

      const result = await sut.getDeviceById('id-123');

      expect(result.isLeft()).toBe(true);
      expect(result.getLeft()).toEqual(error);
    });
  });

  describe('createDevice', () => {
    it('should create a device and return it when the response is successful', async () => {
      const data = { uuid: 'new-123', name: 'New Device' };
      (driveServerClient.POST as Mock).mockResolvedValue({ data });

      const result = await sut.createDevice('New Device');

      expect(result.isRight()).toBe(true);
      expect(result.getRight()).toEqual(data);
    });

    it('should return an error when response is not successful', async () => {
      (driveServerClient.POST as Mock).mockResolvedValue({ data: undefined });

      const result = await sut.createDevice('New Device');

      expect(result.isLeft()).toBe(true);
      expect(logger.error).toHaveBeenCalled();
    });

    it('should return an error when the request throws an exception', async () => {
      const error = new Error('Create failed');
      (driveServerClient.POST as Mock).mockRejectedValue(error);

      const result = await sut.createDevice('New Device');

      expect(result.isLeft()).toBe(true);
      expect(result.getLeft()).toEqual(error);
    });
  });

  describe('updateDevice', () => {
    it('should update a device and return it when the response is successful', async () => {
      const data = { uuid: 'device-123', name: 'Updated Device' };
      (driveServerClient.PATCH as Mock).mockResolvedValue({ data });

      const result = await sut.updateDevice('device-123', 'Updated Device');

      expect(result.isRight()).toBe(true);
      expect(result.getRight()).toEqual(data);
    });

    it('should return an error when response is not successful', async () => {
      (driveServerClient.PATCH as Mock).mockResolvedValue({ data: undefined });

      const result = await sut.updateDevice('device-123', 'Updated Device');

      expect(result.isLeft()).toBe(true);
      expect(logger.error).toHaveBeenCalled();
    });

    it('should return an error when the request throws an exception', async () => {
      const error = new Error('Update failed');
      (driveServerClient.PATCH as Mock).mockRejectedValue(error);

      const result = await sut.updateDevice('device-123', 'Updated Device');

      expect(result.isLeft()).toBe(true);
      expect(result.getLeft()).toEqual(error);
    });
  });
});
