import os from 'node:os';
import { call, calls, deepMocked, partialSpyOn } from 'tests/vitest/utils.helper.test';
import { driveServerWip } from '@/infra/drive-server-wip/drive-server-wip.module';
import configStore from '../config';
import { createUniqueDevice, saveDeviceToConfig } from './service';
import { CreateDeviceError } from '@/infra/drive-server-wip/services/backup/create-device';

vi.mock(import('node:os'));
vi.mock(import('@/apps/main/config'));

describe('Device Service', () => {
  const hostnameMock = deepMocked(os.hostname);
  const configStoreMock = deepMocked(configStore.set);
  const createDeviceMock = partialSpyOn(driveServerWip.backup, 'createDevice');

  const deviceMock = {
    plainName: 'name',
    id: 1,
    uuid: 'test-uuid',
    bucket: 'test-bucket',
    removed: false,
    hasBackups: true,
    lastBackupAt: '2023-01-01',
  };

  beforeEach(() => {
    hostnameMock.mockReturnValue('hostname');
  });

  describe('saveDeviceToConfig', () => {
    it('should save device ID, UUID and create empty backup list in the config store', () => {
      // When
      saveDeviceToConfig(deviceMock);
      // Then
      calls(configStoreMock).toStrictEqual([
        ['deviceUuid', 'test-uuid'],
        ['backupList', {}],
      ]);
    });
  });

  describe('createUniqueDevice', () => {
    it('should create a unique device with the device hostname and return the device if the creation is successful', async () => {
      // Given
      createDeviceMock.mockResolvedValue({ data: {} });
      // When
      const { data, error } = await createUniqueDevice();
      // Then
      call(createDeviceMock).toStrictEqual({ deviceName: 'hostname' });
      expect(data).toBeDefined();
      expect(error).toBeUndefined();
    });

    it('should try multiple times to create a unique device with the name of the hostname plus the number of try', async () => {
      // Given
      createDeviceMock
        .mockResolvedValueOnce({ error: new CreateDeviceError('ALREADY_EXISTS') })
        .mockResolvedValueOnce({ error: new CreateDeviceError('ALREADY_EXISTS') })
        .mockResolvedValueOnce({ error: new CreateDeviceError('ALREADY_EXISTS') })
        .mockResolvedValueOnce({ data: {} });
      // When
      const { data, error } = await createUniqueDevice(4);
      // Then
      expect(data).toBeDefined();
      expect(error).toBeUndefined();
      calls(createDeviceMock).toStrictEqual([
        { deviceName: 'hostname' },
        { deviceName: 'hostname (1)' },
        { deviceName: 'hostname (2)' },
        { deviceName: 'hostname (3)' },
      ]);
    });

    it('should return an error if the device creation fails', async () => {
      createDeviceMock
        .mockResolvedValueOnce({ error: new CreateDeviceError('ALREADY_EXISTS') })
        .mockResolvedValueOnce({ error: new CreateDeviceError('ALREADY_EXISTS') })
        .mockResolvedValueOnce({ error: new CreateDeviceError('ALREADY_EXISTS') })
        .mockResolvedValueOnce({ data: {} });
      // When
      const { data, error } = await createUniqueDevice(2);
      // Then
      expect(data).toBeUndefined();
      expect(error?.message).toBe('Could not create device trying different names');
      calls(createDeviceMock).toStrictEqual([{ deviceName: 'hostname' }, { deviceName: 'hostname (1)' }, { deviceName: 'hostname (2)' }]);
    });
  });
});
