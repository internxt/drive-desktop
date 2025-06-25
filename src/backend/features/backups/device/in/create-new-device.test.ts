import { beforeEach } from 'vitest';
import { createUniqueDevice } from '@/backend/features/backups/device/in/create-unique-device';
import { deepMocked } from 'tests/vitest/utils.helper.test';
import { components } from '@/apps/shared/HttpClient/schema';
import { mockDeep } from 'vitest-mock-extended';
import { saveDeviceToConfig } from '@/backend/features/backups/device/in/save-device-to-config';
import { decryptDeviceName } from '@/backend/features/backups/device/in/decrypt-device-name';
import { createNewDevice } from '@/backend/features/backups/device/in/create-new-device';

vi.mock(import('@/backend/features/backups/device/in/create-unique-device'));
vi.mock(import('@/backend/features/backups/device/in/save-device-to-config'));
vi.mock(import('@/backend/features/backups/device/in/decrypt-device-name'));

describe('createNewDevice', () => {
  const createUniqueDeviceMock = deepMocked(createUniqueDevice);
  const saveDeviceToConfigMock = deepMocked(saveDeviceToConfig);
  const decryptDeviceNameMock = deepMocked(decryptDeviceName);

  const deviceDtoMock = mockDeep<components['schemas']['DeviceDto']>();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should save device to config if successfully created device', async () => {
    createUniqueDeviceMock.mockResolvedValue({ data: deviceDtoMock });

    await createNewDevice();

    expect(saveDeviceToConfigMock).toHaveBeenCalledWith(expect.objectContaining(deviceDtoMock));
    expect(decryptDeviceNameMock).toHaveBeenCalledWith(deviceDtoMock);
  });

  it('should return decrypted device name if successfully created device', async () => {
    createUniqueDeviceMock.mockResolvedValue({ data: deviceDtoMock });

    await createNewDevice();

    expect(decryptDeviceNameMock).toHaveBeenCalledWith(deviceDtoMock);
  });

  it('should return error if device creation fails', async () => {
    const errorMock = new Error('Device creation failed');
    createUniqueDeviceMock.mockResolvedValue({ error: errorMock });

    const { error, data } = await createNewDevice();

    expect(saveDeviceToConfigMock).not.toHaveBeenCalled();
    expect(decryptDeviceNameMock).not.toHaveBeenCalled();
    expect(error).toBe(errorMock);
    expect(data).toBeUndefined();
  });
});
