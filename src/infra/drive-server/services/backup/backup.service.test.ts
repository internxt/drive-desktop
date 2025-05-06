import { BackupService } from './backup.service';
import { driveServerClient } from '../../client/drive-server.client.instance';
import { logger } from '../../../../core/LoggerService/LoggerService';

jest.mock('../../client/drive-server.client.instance', () => ({
  driveServerClient: {
    GET: jest.fn(),
    POST: jest.fn(),
    PATCH: jest.fn(),
  },
}));

jest.mock('../../../../apps/main/auth/service', () => ({
  getNewApiHeaders: jest.fn(() => ({})),
}));

jest.mock('../../../../core/LoggerService/LoggerService', () => ({
  logger: {
    error: jest.fn(),
  },
}));

describe('BackupService', () => {
  let sut: BackupService;

  beforeEach(() => {
    sut = new BackupService();
    jest.clearAllMocks();
  });

  describe('getDevices', () => {
    it('should return a list of devices when the response is successful', async () => {
      const data = [{ uuid: '123', name: 'Device 1' }];
      (driveServerClient.GET as jest.Mock).mockResolvedValue({ data });

      const result = await sut.getDevices();

      expect(result.isRight()).toBe(true);
      expect(result.getRight()).toEqual(data);
    });

    it('should return an error when response is not successful', async () => {
      (driveServerClient.GET as jest.Mock).mockResolvedValue({ data: undefined });

      const result = await sut.getDevices();

      expect(result.isLeft()).toBe(true);
      expect(result.getLeft()).toBeInstanceOf(Error);
      expect(logger.error).toHaveBeenCalled();
    });

    it('should return an error when the request throws an exception', async () => {
      const error = new Error('Request failed');
      (driveServerClient.GET as jest.Mock).mockRejectedValue(error);

      const result = await sut.getDevices();

      expect(result.isLeft()).toBe(true);
      expect(result.getLeft()).toEqual(error);
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('getDevice', () => {
    it('should return a device when the response is successful', async () => {
      const data = { uuid: '123', name: 'Device A' };
      (driveServerClient.GET as jest.Mock).mockResolvedValue({ data });

      const result = await sut.getDevice('123');

      expect(result.isRight()).toBe(true);
      expect(result.getRight()).toEqual(data);
    });

    it('should return an error when response is not successful', async () => {
      (driveServerClient.GET as jest.Mock).mockResolvedValue({ data: undefined });

      const result = await sut.getDevice('123');

      expect(result.isLeft()).toBe(true);
      expect(logger.error).toHaveBeenCalled();
    });

    it('should return an error when the request throws an exception', async () => {
      const error = new Error('Error fetching device');
      (driveServerClient.GET as jest.Mock).mockRejectedValue(error);

      const result = await sut.getDevice('123');

      expect(result.isLeft()).toBe(true);
      expect(result.getLeft()).toEqual(error);
    });
  });

  describe('getDeviceById', () => {
    it('should get a device by id and return it when the response is successful', async () => {
      const data = { uuid: 'id-123', name: 'Device B' };
      (driveServerClient.GET as jest.Mock).mockResolvedValue({ data });

      const result = await sut.getDeviceById('id-123');

      expect(result.isRight()).toBe(true);
      expect(result.getRight()).toEqual(data);
    });

    it('should return an error when response is not successful', async () => {
      (driveServerClient.GET as jest.Mock).mockResolvedValue({ data: undefined });

      const result = await sut.getDeviceById('id-123');

      expect(result.isLeft()).toBe(true);
      expect(logger.error).toHaveBeenCalled();
    });

    it('should return an error when the request throws an exception', async () => {
      const error = new Error('Exception occurred');
      (driveServerClient.GET as jest.Mock).mockRejectedValue(error);

      const result = await sut.getDeviceById('id-123');

      expect(result.isLeft()).toBe(true);
      expect(result.getLeft()).toEqual(error);
    });
  });

  describe('createDevice', () => {
    it('should create a device and return it when the response is successful', async () => {
      const data = { uuid: 'new-123', name: 'New Device' };
      (driveServerClient.POST as jest.Mock).mockResolvedValue({ data });

      const result = await sut.createDevice('New Device');

      expect(result.isRight()).toBe(true);
      expect(result.getRight()).toEqual(data);
    });

    it('should return an error when response is not successful', async () => {
      (driveServerClient.POST as jest.Mock).mockResolvedValue({ data: undefined });

      const result = await sut.createDevice('New Device');

      expect(result.isLeft()).toBe(true);
      expect(logger.error).toHaveBeenCalled();
    });

    it('should return an error when the request throws an exception', async () => {
      const error = new Error('Create failed');
      (driveServerClient.POST as jest.Mock).mockRejectedValue(error);

      const result = await sut.createDevice('New Device');

      expect(result.isLeft()).toBe(true);
      expect(result.getLeft()).toEqual(error);
    });
  });

  describe('updateDevice', () => {
    it('should update a device and return it when the response is successful', async () => {
      const data = { uuid: 'device-123', name: 'Updated Device' };
      (driveServerClient.PATCH as jest.Mock).mockResolvedValue({ data });

      const result = await sut.updateDevice('device-123', 'Updated Device');

      expect(result.isRight()).toBe(true);
      expect(result.getRight()).toEqual(data);
    });

    it('should return an error when response is not successful', async () => {
      (driveServerClient.PATCH as jest.Mock).mockResolvedValue({ data: undefined });

      const result = await sut.updateDevice('device-123', 'Updated Device');

      expect(result.isLeft()).toBe(true);
      expect(logger.error).toHaveBeenCalled();
    });

    it('should return an error when the request throws an exception', async () => {
      const error = new Error('Update failed');
      (driveServerClient.PATCH as jest.Mock).mockRejectedValue(error);

      const result = await sut.updateDevice('device-123', 'Updated Device');

      expect(result.isLeft()).toBe(true);
      expect(result.getLeft()).toEqual(error);
    });
  });
});
