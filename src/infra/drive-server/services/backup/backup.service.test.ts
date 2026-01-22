import { calls, partialSpyOn } from 'tests/vitest/utils.helper';
import * as mapErrorModule from '../utils/mapError';
import * as authServiceModule from '../../../../apps/main/auth/service';

vi.mock('axios', async (importOriginal) => {
  const actual = await importOriginal<typeof import('axios')>();
  return {
    ...actual,
    isAxiosError: vi.fn(),
  };
});

import { BackupService } from './backup.service';
import { driveServerClient } from '../../client/drive-server.client.instance';
import { loggerMock } from 'tests/vitest/mocks.helper';

describe('BackupService', () => {
  let sut: BackupService;

  const driveServerGetMock = partialSpyOn(driveServerClient, 'GET');
  const driveServerPostMock = partialSpyOn(driveServerClient, 'POST');
  const driveServerPatchMock = partialSpyOn(driveServerClient, 'PATCH');
  const mapErrorMock = partialSpyOn(mapErrorModule, 'mapError');
  const getNewApiHeadersMock = partialSpyOn(authServiceModule, 'getNewApiHeaders');

  beforeEach(() => {
    sut = new BackupService();
    getNewApiHeadersMock.mockReturnValue({});
    mapErrorMock.mockImplementation((error) => (error instanceof Error ? error : new Error(String(error))));
  });

  describe('getDevices', () => {
    it('should return a list of devices when the response is successful', async () => {
      const apiData = [{ id: 1, uuid: '123', plainName: 'Device 1' }];
      const expectedData = [{ id: 1, uuid: '123', name: 'Device 1' }];
      driveServerGetMock.mockResolvedValue({ data: apiData } as object);

      const result = await sut.getDevices();

      expect(result.isRight()).toBe(true);
      expect(result.getRight()).toMatchObject(expectedData);
    });

    it('should return an error when response is not successful', async () => {
      driveServerGetMock.mockResolvedValue({ data: undefined });

      const result = await sut.getDevices();

      expect(result.isLeft()).toBe(true);
      expect(result.getLeft()).toBeInstanceOf(Error);
    });

    it('should return an error when the request throws an exception', async () => {
      const error = new Error('Request failed');
      driveServerGetMock.mockRejectedValue(error);

      const result = await sut.getDevices();

      expect(result.isLeft()).toBe(true);
      expect(result.getLeft()).toEqual(error);
      calls(loggerMock.error).toHaveLength(1);
    });
  });

  describe('getDevice', () => {
    it('should return a device when the response is successful', async () => {
      const apiData = { id: 1, uuid: '123', plainName: 'Device A' };
      const expectedData = { id: 1, uuid: '123', name: 'Device A' };
      driveServerGetMock.mockResolvedValue({ data: apiData } as object);

      const result = await sut.getDevice('123');

      expect(result.isRight()).toBe(true);
      expect(result.getRight()).toMatchObject(expectedData);
    });

    it('should return an error when response is not successful', async () => {
      driveServerGetMock.mockResolvedValue({ data: undefined });

      const result = await sut.getDevice('123');

      expect(result.isLeft()).toBe(true);
      calls(loggerMock.error).toHaveLength(1);
    });

    it('should return an error when the request throws an exception', async () => {
      const error = new Error('Error fetching device');
      driveServerGetMock.mockRejectedValue(error);

      const result = await sut.getDevice('123');

      expect(result.isLeft()).toBe(true);
      expect(result.getLeft()).toStrictEqual(error);
    });
  });

  describe('getDeviceById', () => {
    it('should get a device by id and return it when the response is successful', async () => {
      const apiData = { id: 2, uuid: 'id-123', plainName: 'Device B' };
      const expectedData = { id: 2, uuid: 'id-123', name: 'Device B' };
      driveServerGetMock.mockResolvedValue({ data: apiData } as object);

      const result = await sut.getDeviceById('id-123');

      expect(result.isRight()).toBe(true);
      expect(result.getRight()).toMatchObject(expectedData);
    });

    it('should return an error when response is not successful', async () => {
      driveServerGetMock.mockResolvedValue({ data: undefined });

      const result = await sut.getDeviceById('id-123');

      expect(result.isLeft()).toBe(true);
      calls(loggerMock.error).toHaveLength(1);
    });

    it('should return an error when the request throws an exception', async () => {
      const error = new Error('Exception occurred');
      driveServerGetMock.mockRejectedValue(error);

      const result = await sut.getDeviceById('id-123');

      expect(result.isLeft()).toBe(true);
      expect(result.getLeft()).toStrictEqual(error);
    });
  });

  describe('createDevice', () => {
    it('should create a device and return it when the response is successful', async () => {
      const apiData = { id: 3, uuid: 'new-123', plainName: 'New Device' };
      const expectedData = { id: 3, uuid: 'new-123', name: 'New Device' };
      driveServerPostMock.mockResolvedValue({ data: apiData } as object);

      const result = await sut.createDevice('New Device');

      expect(result.isRight()).toBe(true);
      expect(result.getRight()).toMatchObject(expectedData);
    });

    it('should return an error when response is not successful', async () => {
      driveServerPostMock.mockResolvedValue({ data: undefined });

      const result = await sut.createDevice('New Device');

      expect(result.isLeft()).toBe(true);
      calls(loggerMock.error).toHaveLength(1);
    });

    it('should return an error when the request throws an exception', async () => {
      const error = new Error('Create failed');
      driveServerPostMock.mockRejectedValue(error);

      const result = await sut.createDevice('New Device');

      expect(result.isLeft()).toBe(true);
      expect(result.getLeft()).toStrictEqual(error);
    });
  });

  describe('updateDevice', () => {
    it('should update a device and return it when the response is successful', async () => {
      const apiData = { id: 4, uuid: 'device-123', plainName: 'Updated Device' };
      const expectedData = { id: 4, uuid: 'device-123', name: 'Updated Device' };
      driveServerPatchMock.mockResolvedValue({ data: apiData } as object);

      const result = await sut.updateDevice('device-123', 'Updated Device');

      expect(result.isRight()).toBe(true);
      expect(result.getRight()).toEqual(expectedData);
    });

    it('should return an error when response is not successful', async () => {
      driveServerPatchMock.mockResolvedValue({ data: undefined });

      const result = await sut.updateDevice('device-123', 'Updated Device');

      expect(result.isLeft()).toBe(true);
      calls(loggerMock.error).toHaveLength(1);
    });

    it('should return an error when the request throws an exception', async () => {
      const error = new Error('Update failed');
      driveServerPatchMock.mockRejectedValue(error);

      const result = await sut.updateDevice('device-123', 'Updated Device');

      expect(result.isLeft()).toBe(true);
      expect(result.getLeft()).toStrictEqual(error);
    });
  });
});
