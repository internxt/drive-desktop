import { clientMock } from 'tests/vitest/mocks.helper.test';
import { getDeviceByIdentifier } from './get-device-by-identifier';

describe('get-device-by-identifier', () => {
  const key = 'test-key';
  const hostname = 'test-hostname';
  const deviceResult = {
    id: 1,
    uuid: 'uuid-1',
    name: 'device-1',
    bucket: 'bucket-1',
    removed: false,
    hasBackups: true,
    lastBackupAt: '2024-01-01T00:00:00Z',
  };

  it('Should return data when a single device is found', async () => {
    // Given
    const dataResult = [{ folder: deviceResult, key, hostname }];
    clientMock.GET.mockResolvedValue({ data: dataResult });
    // When
    const { data, error } = await getDeviceByIdentifier({ key });
    // Then
    expect(data).toMatchObject({ device: deviceResult, key, hostname });
    expect(error).toBeUndefined();
  });

  it('Should return NOT_FOUND error when device does not exist', async () => {
    // Given
    clientMock.GET.mockResolvedValue({ response: { status: 404 } });
    // When
    const { error } = await getDeviceByIdentifier({ key });
    // Then
    expect(error?.code).toStrictEqual('NOT_FOUND');
  });

  it('Should return MULTIPLE_DEVICES_FOUND error when multiple devices are found', async () => {
    // Given
    const dataResult = [{ folder: deviceResult }, { folder: { ...deviceResult, id: 2, uuid: 'uuid-2', name: 'device-2' } }];
    clientMock.GET.mockResolvedValue({
      data: dataResult,
    });
    // WHen
    const { error } = await getDeviceByIdentifier({ key });
    // Then
    expect(error?.code).toStrictEqual('MULTIPLE_DEVICES_FOUND');
  });

  it('Should return INVALID_DEVICE_DATA error when folder is missing', async () => {
    // Given
    const dataResult = [{ folder: null }];
    clientMock.GET.mockResolvedValue({ data: dataResult });
    // When
    const { error } = await getDeviceByIdentifier({ key });
    // Then
    expect(error?.code).toStrictEqual('INVALID_DEVICE_DATA');
  });

  it('Should return NOT_FOUND error when data is empty array', async () => {
    // Given
    clientMock.GET.mockResolvedValue({ data: [], response: { status: 200 } });
    // When
    const { error } = await getDeviceByIdentifier({ key });
    // Then
    expect(error?.code).toStrictEqual('NOT_FOUND');
  });
});
