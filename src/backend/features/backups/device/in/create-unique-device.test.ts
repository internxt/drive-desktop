import { deepMocked } from 'tests/vitest/utils.helper.test';
import { vi } from 'vitest';
import os from 'os';
import { createUniqueDevice } from './create-unique-device';
import { loggerMock } from '../../../../../../tests/vitest/mocks.helper.test';
import { tryCreateDevice } from '@/backend/features/backups/device/in/try-create-device';

vi.mock('os');
vi.mock(import('@/backend/features/backups/device/in/try-create-device'));
describe('createUniqueDevice', () => {
  const osMock = deepMocked(os.hostname);
  const tryCreateDeviceMock = deepMocked(tryCreateDevice);

  const hostname = 'test-hostname';

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
    vi.useFakeTimers();
    vi.setSystemTime(new Date(1000));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should create a unique device with the device hostname and return the device if the creation is successful', async () => {
    osMock.mockReturnValue(hostname);
    tryCreateDeviceMock.mockResolvedValueOnce({
      data: { ...deviceMock, name: hostname },
    });

    const { data, error } = await createUniqueDevice();

    expect(tryCreateDeviceMock).toHaveBeenCalledWith(hostname);
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
      error.message = 'Device already exists';
      tryCreateDeviceMock.mockResolvedValueOnce({ error });
    }

    // Mock attempt 10 succeeding
    tryCreateDeviceMock.mockResolvedValueOnce({
      data: { ...deviceMock, name: `${hostname} (10)` },
    });
    const { data, error } = await createUniqueDevice(attempts);

    expect(tryCreateDeviceMock).toHaveBeenNthCalledWith(1, hostname);

    for (let i = 1; i <= 10; i++) {
      const expectedName = `${hostname} (${i})`;
      expect(tryCreateDeviceMock).toHaveBeenNthCalledWith(i + 1, expectedName);
    }

    expect(data).toStrictEqual({
      ...deviceMock,
      name: `${hostname} (10)`,
    });

    // Initial + 10 retries
    expect(tryCreateDeviceMock).toHaveBeenCalledTimes(11);
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
      tryCreateDeviceMock.mockResolvedValueOnce({ error });
    }
    loggerMock.error.mockReturnValue(new Error('Could not create device trying different names'));

    const { data, error } = await createUniqueDevice(attempts);

    expect(tryCreateDeviceMock).toHaveBeenCalledTimes(12);
    expect(error).toBeInstanceOf(Error);
    expect(error?.message).toContain('Could not create device trying different names');
    expect(data).toBe(undefined);
  });
  it('should return an error if the device creation fails with an error regarding creation', async () => {
    const attempts = 11;
    osMock.mockReturnValue(hostname);

    const err = new Error('Error creating device');
    tryCreateDeviceMock.mockResolvedValueOnce({ error: err });
    loggerMock.error.mockReturnValue(new Error('Error creating device'));

    const { data, error } = await createUniqueDevice(attempts);

    expect(tryCreateDeviceMock).toHaveBeenCalledTimes(1);
    expect(error).toBeInstanceOf(Error);
    expect(error?.message).toContain('Error creating device');
    expect(data).toBe(undefined);
  });
});
