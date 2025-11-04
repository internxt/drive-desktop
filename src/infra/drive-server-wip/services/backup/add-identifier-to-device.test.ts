import { clientMock } from 'tests/vitest/mocks.helper.test';
import { addIdentifierToDevice } from './add-identifier-to-device';
import { mockProps } from '@/tests/vitest/utils.helper.test';

describe('add-identifier-to-device', () => {
  const mockDevice = {
    id: 1,
    uuid: 'device-uuid-123',
    name: 'test-device',
    bucket: 'bucket-1',
    removed: false,
    hasBackups: true,
    lastBackupAt: '2024-01-01T00:00:00Z',
  };

  const props = mockProps<typeof addIdentifierToDevice>({
    key: 'test-key',
  });

  it('should return data when identifier is successfully added', async () => {
    // Given
    clientMock.POST.mockResolvedValue({ data: { folder: mockDevice } });
    // When
    const { data, error } = await addIdentifierToDevice(props);
    // Then
    expect(data).toStrictEqual(mockDevice);
    expect(error).toBeUndefined();
  });

  it('should return NOT_FOUND error when device does not exist', async () => {
    // Given
    clientMock.POST.mockResolvedValue({ response: { status: 404 } });
    // When
    const { error } = await addIdentifierToDevice(props);
    // Then
    expect(error?.code).toBe('NOT_FOUND');
  });

  it('should return ALREADY_HAS_IDENTIFIER error when device already has identifier', async () => {
    // Given
    clientMock.POST.mockResolvedValue({ response: { status: 409 } });
    // When
    const { error } = await addIdentifierToDevice(props);
    // Then
    expect(error?.code).toBe('ALREADY_HAS_IDENTIFIER');
  });

  it('should return INVALID_DEVICE_DATA error when folder is missing', async () => {
    // Given
    clientMock.POST.mockResolvedValue({ data: { folder: null }, response: { status: 200 } });
    // When
    const { error } = await addIdentifierToDevice(props);
    // Then
    expect(error?.code).toBe('INVALID_DEVICE_DATA');
  });
});
