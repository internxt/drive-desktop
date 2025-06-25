import { beforeEach } from 'vitest';
import { deepMocked } from '../../../../../../tests/vitest/utils.helper.test';
import { getDeviceUuid } from '@/backend/features/backups/device/in/get-device-uuid';
import { driveServerWipModule } from '@/infra/drive-server-wip/drive-server-wip.module';
import { mockDeep } from 'vitest-mock-extended';
import { components } from '@/apps/shared/HttpClient/schema';
import { renameDevice } from '@/backend/features/backups/device/in/rename-device';
import { decryptDeviceName } from '@/backend/features/backups/device/in/decrypt-device-name';

vi.mock(import('@/backend/features/backups/device/in/get-device-uuid'));
vi.mock(import('@/backend/features/backups/device/in/decrypt-device-name'));

describe('Rename Device', () => {
  const getDeviceUuidMock = deepMocked(getDeviceUuid);
  const updateDeviceMock = deepMocked(driveServerWipModule.backup.updateDevice);
  const decryptDeviceNameMock = deepMocked(decryptDeviceName);

  const decryptedDeviceName = 'Decrypted New Device Name';
  const encryptedDeviceName = 'Encrypted New Device Name';
  const deviceDtoMock = mockDeep<components['schemas']['DeviceDto']>();

  const deviceUuidMock = 'test-device-uuid';
  const deviceMock = {
    id: 'test-device-id',
    uuid: deviceUuidMock,
    bucket: 'test-bucket',
    removed: false,
    hasBackups: true,
    lastBackupAt: '',
  };

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should get the saved device uuid, rename the device, and return the decrypted name', async () => {
    const updateDeviceResult = { name: encryptedDeviceName, uuid: deviceUuidMock, ...deviceDtoMock };
    const decryptDeviceNameResult = { name: decryptedDeviceName, ...deviceMock };

    getDeviceUuidMock.mockReturnValue(deviceUuidMock);
    updateDeviceMock.mockResolvedValue({
      data: updateDeviceResult,
    });
    decryptDeviceNameMock.mockReturnValue(decryptDeviceNameResult);

    const result = await renameDevice(encryptedDeviceName);

    expect(getDeviceUuidMock).toHaveBeenCalled();
    expect(updateDeviceMock).toHaveBeenCalledWith({
      deviceUuid: deviceUuidMock,
      deviceName: encryptedDeviceName,
    });
    expect(decryptDeviceNameMock).toHaveBeenCalledWith(updateDeviceResult);
    expect(result).toEqual(decryptDeviceNameResult);
  });

  it('should throw an error if the request to rename a device fails', async () => {
    getDeviceUuidMock.mockReturnValue(deviceUuidMock);
    updateDeviceMock.mockResolvedValue({ error: new Error('Error creating device') });

    await expect(renameDevice(encryptedDeviceName)).rejects.toThrow('Error in the request to rename a device');

    expect(getDeviceUuidMock).toHaveBeenCalled();
    expect(updateDeviceMock).toHaveBeenCalledWith({
      deviceUuid: deviceUuidMock,
      deviceName: encryptedDeviceName,
    });
  });
});
