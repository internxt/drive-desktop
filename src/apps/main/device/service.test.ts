import { afterAll, beforeAll, beforeEach, describe, vi } from 'vitest';
import os from 'os';
import { aes } from '@internxt/lib';
import { deepMocked } from 'tests/vitest/utils.helper.test';
import { driveServerWipModule } from '@/infra/drive-server-wip/drive-server-wip.module';
import configStore from '../config';
import { createUniqueDevice, decryptDeviceName, fetchDevice, saveDeviceToConfig } from './service';
import { loggerMock } from '../../../../tests/vitest/mocks.helper.test';
import { GetDeviceError } from '@/infra/drive-server-wip/services/backup/get-device';

vi.mock('@internxt/lib');
vi.mock('os');
vi.mock('@/apps/main/config');

describe('Device Service', () => {
  const decryptMock = deepMocked(aes.decrypt);

  const decryptedName = 'decrypted-name';

  const deviceMock = {
    name: 'encrypted-name',
    id: 1,
    uuid: 'test-uuid',
    bucket: 'test-bucket',
    removed: false,
    hasBackups: true,
    lastBackupAt: '2023-01-01',
  };

  beforeAll(() => {
    vi.stubEnv('NEW_CRYPTO_KEY', 'test-key');
  });

  afterAll(() => {
    vi.unstubAllEnvs();
  });

  beforeEach(() => {
    process.env.NEW_CRYPTO_KEY = 'test-key';
    vi.clearAllMocks();
  });

  describe('fetchDevice', () => {
    const getDeviceMock = deepMocked(driveServerWipModule.backup.getDevice);

    it('should return the decrypted device when we find the the device in the API', async () => {
      getDeviceMock.mockResolvedValueOnce({ data: deviceMock });
      decryptMock.mockReturnValue(decryptedName);

      const { data, error } = await fetchDevice(deviceMock.uuid);
      expect(getDeviceMock).toHaveBeenCalledWith({ deviceUuid: deviceMock.uuid });
      expect(data).toStrictEqual({
        ...deviceMock,
        name: decryptedName,
      });
      expect(error).toBe(undefined);
    });

    it('should return null if the device is not found', async () => {
      const http404Error = new GetDeviceError('NOT_FOUND', {
        cause: {
          response: {
            status: 404,
          },
        },
      });

      getDeviceMock.mockResolvedValueOnce({ error: http404Error });

      const { data, error } = await fetchDevice(deviceMock.uuid);
      expect(getDeviceMock).toHaveBeenCalledWith({ deviceUuid: deviceMock.uuid });
      expect(data).toBeNull();
      expect(error).toBe(undefined);
    });

    it('should return error if the request is not successful', async () => {
      const http500Error = new Error('Internal server error', {
        cause: {
          response: {
            status: 500,
          },
        },
      });
      getDeviceMock.mockResolvedValueOnce({ error: http500Error });
      loggerMock.error.mockReturnValue(new Error('Error fetching device'));
      const result = await fetchDevice(deviceMock.uuid);

      expect(getDeviceMock).toHaveBeenCalledWith({ deviceUuid: deviceMock.uuid });
      expect(result.data).toBe(undefined);
      expect(result.error).toBeInstanceOf(Error);
      expect(result.error?.message).toContain('Error fetching device');
    });
  });

  describe('saveDeviceToConfig', () => {
    const configStoreMock = deepMocked(configStore.set);

    it('should save device ID, UUID and create empty backup list in the config store', () => {
      saveDeviceToConfig(deviceMock);

      expect(configStoreMock).toHaveBeenCalledTimes(3);
      expect(configStoreMock).toHaveBeenCalledWith('deviceId', 1);
      expect(configStoreMock).toHaveBeenCalledWith('deviceUuid', 'test-uuid');
      expect(configStoreMock).toHaveBeenCalledWith('backupList', {});
    });
  });

  describe('createUniqueDevice', () => {
    const osMock = deepMocked(os.hostname);
    const createDeviceMock = deepMocked(driveServerWipModule.backup.createDevice);
    const hostname = 'test-hostname';

    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(1000));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should create a unique device with the device hostname and return the device if the creation is successful', async () => {
      osMock.mockReturnValue(hostname);
      createDeviceMock.mockResolvedValueOnce({
        data: { ...deviceMock, name: hostname },
      });

      const { data, error } = await createUniqueDevice();

      expect(createDeviceMock).toHaveBeenCalledWith({
        deviceName: hostname,
      });

      expect(data).toStrictEqual({
        ...deviceMock,
        name: hostname,
      });
      expect(error).toBe(undefined);
    });

    it('should try multiple times to create a unique device with the name of the hostname plus the number of try', async () => {
      const attempts = 10;
      osMock.mockReturnValue(hostname);

      // Mock attempts 1-10 failing (basename + (basename + number))
      for (let i = 1; i <= 10; i++) {
        const error = new Error('Device already exists', {
          cause: {
            response: { status: 409 },
          },
        });
        createDeviceMock.mockResolvedValueOnce({ error });
      }

      // Mock attempt 10 succeeding
      createDeviceMock.mockResolvedValueOnce({
        data: { ...deviceMock, name: `${hostname} (10)` },
      });
      const { data, error } = await createUniqueDevice(attempts);

      expect(createDeviceMock).toHaveBeenNthCalledWith(1, {
        deviceName: hostname,
      });

      for (let i = 1; i <= 10; i++) {
        expect(createDeviceMock).toHaveBeenNthCalledWith(i + 1, {
          deviceName: `${hostname} (${i})`,
        });
      }

      expect(data).toStrictEqual({
        ...deviceMock,
        name: `${hostname} (10)`,
      });

      // Initial + 10 retries
      expect(createDeviceMock).toHaveBeenCalledTimes(11);
      expect(error).toBe(undefined);
    });

    it('should return an error if the device creation fails', async () => {
      const attempts = 11;
      osMock.mockReturnValue(hostname);

      // Initial + 11 attempts failing
      for (let i = 1; i <= 12; i++) {
        const error = new Error('Device already exists', {
          cause: {
            response: { status: 409 },
          },
        });
        createDeviceMock.mockResolvedValueOnce({ error });
      }
      loggerMock.error.mockReturnValue(new Error('Could not create device trying different names'));

      const { data, error } = await createUniqueDevice(attempts);

      expect(createDeviceMock).toHaveBeenCalledTimes(12);
      expect(error).toBeInstanceOf(Error);
      expect(error?.message).toContain('Could not create device trying different names');
      expect(data).toBe(undefined);
    });
  });

  describe('decryptDeviceName', () => {
    it('should decrypt the device name with the correct key using bucket', () => {
      decryptMock.mockReturnValue(decryptedName);

      const result = decryptDeviceName(deviceMock);
      expect(decryptMock).toHaveBeenCalledWith(deviceMock.name, `${process.env.NEW_CRYPTO_KEY}-${deviceMock.bucket}`);
      expect(result).toStrictEqual({
        ...deviceMock,
        name: decryptedName,
      });
    });

    it('should fall back to using null in the key when first decryption fails', () => {
      decryptMock
        .mockImplementationOnce(() => {
          throw new Error('Decryption failed');
        })
        .mockReturnValueOnce(decryptedName);

      const result = decryptDeviceName(deviceMock);
      expect(decryptMock).toHaveBeenCalledTimes(2);
      expect(decryptMock).toHaveBeenNthCalledWith(1, deviceMock.name, `${process.env.NEW_CRYPTO_KEY}-${deviceMock.bucket}`);
      expect(decryptMock).toHaveBeenNthCalledWith(2, deviceMock.name, `${process.env.NEW_CRYPTO_KEY}-${null}`);
      expect(result).toStrictEqual({
        ...deviceMock,
        name: decryptedName,
      });
    });
  });
});
