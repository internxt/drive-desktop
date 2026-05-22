import os from 'node:os';
import { call, calls, deepMocked, mockProps, partialSpyOn } from 'tests/vitest/utils.helper.test';
import { driveServerWip } from '@/infra/drive-server-wip/drive-server-wip.module';
import { CreateDeviceError } from '@/infra/drive-server-wip/services/backup/create-device';
import configStore from '../config';
import { createUniqueDevice, saveDeviceToConfig } from './service';

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

  let props: Parameters<typeof createUniqueDevice>[0];

  beforeEach(() => {
    hostnameMock.mockReturnValue('hostname');

    props = mockProps<typeof createUniqueDevice>({});
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
      const { data, error } = await createUniqueDevice(props);
      // Then
      call(createDeviceMock).toMatchObject({ context: { deviceName: 'hostname' } });
      expect(data).toBeDefined();
      expect(error).toBeUndefined();
    });

    it('should try multiple times to create a unique device with the name of the hostname plus the number of try', async () => {
      // Given
      props.attempts = 4;
      createDeviceMock
        .mockResolvedValueOnce({ error: new CreateDeviceError('ALREADY_EXISTS') })
        .mockResolvedValueOnce({ error: new CreateDeviceError('ALREADY_EXISTS') })
        .mockResolvedValueOnce({ error: new CreateDeviceError('ALREADY_EXISTS') })
        .mockResolvedValueOnce({ data: {} });
      // When
      const { data, error } = await createUniqueDevice(props);
      // Then
      expect(data).toBeDefined();
      expect(error).toBeUndefined();
      calls(createDeviceMock).toMatchObject([
        { context: { deviceName: 'hostname' } },
        { context: { deviceName: 'hostname (1)' } },
        { context: { deviceName: 'hostname (2)' } },
        { context: { deviceName: 'hostname (3)' } },
      ]);
    });

    it('should return an error if the device creation fails', async () => {
      props.attempts = 2;
      createDeviceMock
        .mockResolvedValueOnce({ error: new CreateDeviceError('ALREADY_EXISTS') })
        .mockResolvedValueOnce({ error: new CreateDeviceError('ALREADY_EXISTS') })
        .mockResolvedValueOnce({ error: new CreateDeviceError('ALREADY_EXISTS') });
      // When
      const { data, error } = await createUniqueDevice(props);
      // Then
      expect(data).toBeUndefined();
      expect(error?.message).toBe('Could not create device trying different names');
      calls(createDeviceMock).toMatchObject([
        { context: { deviceName: 'hostname' } },
        { context: { deviceName: 'hostname (1)' } },
        { context: { deviceName: 'hostname (2)' } },
      ]);
    });
  });
});
