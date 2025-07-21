import { afterAll, beforeAll, beforeEach, vi } from 'vitest';
import { deepMocked } from '../../../../../../tests/vitest/utils.helper.test';
import { aes } from '@internxt/lib';
import { decryptDeviceName } from '@/backend/features/backups/device/in/decrypt-device-name';

vi.mock('@internxt/lib');

describe('decryptDeviceName', () => {
  const decryptMock = deepMocked(aes.decrypt);
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

  beforeAll(() => {
    vi.stubEnv('NEW_CRYPTO_KEY', 'test-key');
  });

  afterAll(() => {
    vi.unstubAllEnvs();
  });

  beforeEach(() => {
    process.env.NEW_CRYPTO_KEY = 'test-key';
    vi.clearAllMocks();
  });

  it('should decrypt the device name with the correct key using bucket', () => {
    decryptMock.mockReturnValue(decryptedName);

    const result = decryptDeviceName(deviceMock);
    expect(decryptMock).toHaveBeenCalledWith(deviceMock.name, `${process.env.NEW_CRYPTO_KEY}-${deviceMock.bucket}`);
    expect(result).toStrictEqual({
      ...deviceMock,
      name: decryptedName,
    });
  });
  it('should fall back to using null in the key when first decryption fails', () => {
    decryptMock
      .mockImplementationOnce(() => {
        throw new Error('Decryption failed');
      })
      .mockReturnValueOnce(decryptedName);

    const result = decryptDeviceName(deviceMock);
    expect(decryptMock).toHaveBeenCalledTimes(2);
    expect(decryptMock).toHaveBeenNthCalledWith(1, deviceMock.name, `${process.env.NEW_CRYPTO_KEY}-${deviceMock.bucket}`);
    expect(decryptMock).toHaveBeenNthCalledWith(2, deviceMock.name, `${process.env.NEW_CRYPTO_KEY}-${null}`);
    expect(result).toStrictEqual({
      ...deviceMock,
      name: decryptedName,
    });
  });
});
