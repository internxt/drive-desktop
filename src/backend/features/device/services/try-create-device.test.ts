import { deepMocked } from '@/tests/vitest/utils.helper.test';
import { driveServerWipModule } from '@/infra/drive-server-wip/drive-server-wip.module';
import { tryCreateDevice } from './try-create-device';
import { logger } from '@internxt/drive-desktop-core/build/backend';

vi.mock(import('@/infra/drive-server-wip/drive-server-wip.module'));
vi.mock(import('@internxt/drive-desktop-core/build/backend'));

describe('try-create-device', () => {
  const createDeviceWithIdentifierMock = deepMocked(driveServerWipModule.backup.createDeviceWithIdentifier);
  const loggerDebugMock = deepMocked(logger.debug);
  const loggerErrorMock = deepMocked(logger.error);

  const mockDevice = {
    id: 1,
    uuid: 'device-uuid-123',
    name: 'test-device',
    bucket: 'bucket-1',
    removed: false,
    hasBackups: false,
    lastBackupAt: undefined,
  };
  const mockLoggedError = new Error('Logged error');

  const props = {
    key: 'test-key',
    name: 'test-device',
  };

  it('should return device when created successfully', async () => {
    // Given
    createDeviceWithIdentifierMock.mockResolvedValue({ data: mockDevice });
    // When
    const { data } = await tryCreateDevice(props);
    // Then
    expect(data).toStrictEqual(mockDevice);
  });

  it('should return debug error when device already exists', async () => {
    // Given
    const alreadyExistsError = { code: 'ALREADY_EXISTS', message: 'Device already exists' };
    createDeviceWithIdentifierMock.mockResolvedValue({ error: alreadyExistsError });
    loggerDebugMock.mockReturnValue(mockLoggedError);
    // When
    const { error } = await tryCreateDevice(props);
    // Then
    expect(error).toStrictEqual(mockLoggedError);
  });

  it('should return error when device creation fails with unknown error', async () => {
    // Given
    const unknownError = { code: 'UNKNOWN', message: 'Network error' };
    createDeviceWithIdentifierMock.mockResolvedValue({ error: unknownError });
    loggerErrorMock.mockReturnValue(mockLoggedError);
    // When
    const { error } = await tryCreateDevice(props);
    // Then
    expect(error).toStrictEqual(mockLoggedError);
  });
});
