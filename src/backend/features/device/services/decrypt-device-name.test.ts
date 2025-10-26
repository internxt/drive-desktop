import { call, calls, mockProps } from '@/tests/vitest/utils.helper.test';
import { decryptDeviceName } from './decrypt-device-name';
import { aes } from '@internxt/lib';

vi.mock('@internxt/lib');

describe('decrypt-device-name', () => {
  const aesDecryptMock = vi.mocked(aes.decrypt);
  const decryptedName = 'decrypted-device-name';
  const encryptedName = 'encrypted-device-name';
  const bucket = 'bucket';

  const props = mockProps<typeof decryptDeviceName>({ name: encryptedName, bucket });

  it('should decrypt device name using bucket key', () => {
    aesDecryptMock.mockReturnValue(decryptedName);
    const device = decryptDeviceName(props);
    expect(device).toMatchObject({ name: decryptedName, bucket });
    call(aesDecryptMock).toStrictEqual([encryptedName, `${process.env.NEW_CRYPTO_KEY}-${bucket}`]);
  });

  it('should fallback to null bucket key when decryption with bucket fails', () => {
    aesDecryptMock.mockImplementationOnce(() => {
      throw new Error('Decryption failed with bucket');
    });
    aesDecryptMock.mockReturnValueOnce(decryptedName);
    const device = decryptDeviceName(props);
    expect(device).toMatchObject({ name: decryptedName, bucket });
    calls(aesDecryptMock).toStrictEqual([
      [encryptedName, `${process.env.NEW_CRYPTO_KEY}-${bucket}`],
      [encryptedName, `${process.env.NEW_CRYPTO_KEY}-${null}`],
    ]);
  });
});
