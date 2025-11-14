import { clientMock } from 'tests/vitest/mocks.helper.test';
import { createDeviceWithIdentifier } from './create-device-with-identifier';

describe('create-device-with-identifier', () => {
  const context = {
    key: 'test-key',
    hostname: 'test-hostname',
    name: 'test-device-name',
  };

  const mockDevice = {
    id: 1,
    uuid: 'device-uuid-123',
    name: 'test-device',
    bucket: 'bucket-1',
    removed: false,
    hasBackups: false,
    lastBackupAt: '2024-01-01T00:00:00Z',
  };

  it('should return device when created successfully', async () => {
    // Given
    clientMock.POST.mockResolvedValue({ data: { folder: mockDevice } });
    // When
    const { data, error } = await createDeviceWithIdentifier(context);
    // Then
    expect(data).toStrictEqual(mockDevice);
    expect(error).toBeUndefined();
  });

  it('should return ALREADY_EXISTS error when device already exists', async () => {
    // Given
    clientMock.POST.mockResolvedValue({ response: { status: 409 } });
    // When
    const { error } = await createDeviceWithIdentifier(context);
    // Then
    expect(error?.code).toBe('ALREADY_EXISTS');
  });

  it('should return INVALID_DEVICE_DATA error when folder is missing', async () => {
    // Given
    clientMock.POST.mockResolvedValue({ data: { folder: null }, response: { status: 200 } });
    // When
    const { error } = await createDeviceWithIdentifier(context);
    // Then
    expect(error?.code).toBe('INVALID_DEVICE_DATA');
  });
});
