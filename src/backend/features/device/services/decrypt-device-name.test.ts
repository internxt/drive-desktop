import { decryptDeviceName } from './decrypt-device-name';
import { aes } from '@internxt/lib';

vi.mock('@internxt/lib');

describe('decrypt-device-name', () => {
  const aesDecryptMock = vi.mocked(aes.decrypt);
  const decryptedName = 'decrypted-device-name';
  const mockDevice = {
    id: 1,
    uuid: 'device-uuid-123',
    name: 'encrypted-device-name',
    bucket: 'test-bucket',
    removed: false,
    hasBackups: true,
    lastBackupAt: '2024-01-01T00:00:00Z',
  };

  it('should decrypt device name using bucket key', () => {
    aesDecryptMock.mockReturnValue(decryptedName);
    const device = decryptDeviceName(mockDevice);
    expect(device).toStrictEqual({ ...mockDevice, name: decryptedName });
    expect(aesDecryptMock).toHaveBeenCalledWith(mockDevice.name, `${process.env.NEW_CRYPTO_KEY}-${mockDevice.bucket}`);
  });

  it('should fallback to null bucket key when decryption with bucket fails', () => {
    aesDecryptMock.mockImplementationOnce(() => {
      throw new Error('Decryption failed with bucket');
    });
    aesDecryptMock.mockReturnValueOnce(decryptedName);
    const device = decryptDeviceName(mockDevice);
    expect(device).toStrictEqual({ ...mockDevice, name: decryptedName });
    expect(aesDecryptMock).toHaveBeenCalledTimes(2);
    expect(aesDecryptMock).toHaveBeenNthCalledWith(1, mockDevice.name, `${process.env.NEW_CRYPTO_KEY}-${mockDevice.bucket}`);
    expect(aesDecryptMock).toHaveBeenNthCalledWith(2, mockDevice.name, `${process.env.NEW_CRYPTO_KEY}-${null}`);
  });
});
