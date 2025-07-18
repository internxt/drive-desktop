import { deepMocked } from 'tests/vitest/utils.helper.test';
import { driveServerWipModule } from '@/infra/drive-server-wip/drive-server-wip.module';
import { fetchDevice } from '@/backend/features/backups/device/in/fetch-device';
import { GetDeviceError } from '@/infra/drive-server-wip/services/backup/get-device';
import { loggerMock } from '../../../../../../tests/vitest/mocks.helper.test';
import { decryptDeviceName } from '@/backend/features/backups/device/in/decrypt-device-name';
import { beforeEach } from 'vitest';
import { addUnknownDeviceIssue } from '@/backend/features/backups/device/in/add-unknown-device-issue';

vi.mock('@/backend/features/backups/device/in/decrypt-device-name');
vi.mock('@/backend/features/backups/device/in/add-unknown-device-issue');

describe('fetchDevice', () => {
  const decryptDeviceNameMock = deepMocked(decryptDeviceName);
  const addUnknownDeviceIssueMock = deepMocked(addUnknownDeviceIssue);

  const getDeviceMock = deepMocked(driveServerWipModule.backup.getDevice);

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

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return the decrypted device when we find the the device in the API', async () => {
    getDeviceMock.mockResolvedValueOnce({ data: deviceMock });
    const { name, ...rest } = deviceMock;
    decryptDeviceNameMock.mockReturnValue({ name: decryptedName, ...rest });

    const { data, error } = await fetchDevice({ deviceUuid: deviceMock.uuid });
    expect(getDeviceMock).toHaveBeenCalledWith(expect.objectContaining({ deviceUuid: deviceMock.uuid }));

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

    const { data, error } = await fetchDevice({ deviceUuid: deviceMock.uuid });

    expect(getDeviceMock).toHaveBeenCalledWith(expect.objectContaining({ deviceUuid: deviceMock.uuid }));
    expect(data).toBeNull();
    expect(error).toBe(undefined);
  });

  it('should addUnknownDeviceIssue if the device is not found', async () => {
    const http404Error = new GetDeviceError('NOT_FOUND', {
      cause: {
        response: {
          status: 404,
        },
      },
    });

    getDeviceMock.mockResolvedValueOnce({ error: http404Error });

    await fetchDevice({ deviceUuid: deviceMock.uuid });
    expect(loggerMock.info).toHaveBeenCalledWith(
      expect.objectContaining({
        tag: 'BACKUPS',
        msg: `Device not found for deviceUuid: ${deviceMock.uuid}`,
      }),
    );
    expect(addUnknownDeviceIssueMock).toHaveBeenCalledWith(
      expect.objectContaining({
        message: `Device not found for deviceUuid: ${deviceMock.uuid}`,
      }),
    );
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

    const { error, data } = await fetchDevice({ deviceUuid: deviceMock.uuid });

    expect(getDeviceMock).toHaveBeenCalledWith({ deviceUuid: deviceMock.uuid });
    expect(data).toBe(undefined);
    expect(error).toStrictEqual(new Error('Error fetching device'));
  });
});
