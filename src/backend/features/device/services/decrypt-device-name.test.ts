import { call, calls, mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { decryptDeviceName } from './decrypt-device-name';
import { aes } from '@internxt/lib';

describe('decrypt-device-name', () => {
  const aesDecryptMock = partialSpyOn(aes, 'decrypt');
  const decryptedName = 'decrypted-device-name';
  const encryptedName = 'encrypted-device-name';
  const bucket = 'bucket';

  let props: Parameters<typeof decryptDeviceName>[0];

  beforeEach(() => {
    props = mockProps<typeof decryptDeviceName>({ name: encryptedName, bucket });
  });

  it('should decrypt device name using bucket key', () => {
    // Given
    aesDecryptMock.mockReturnValue(decryptedName);
    // When
    const device = decryptDeviceName(props);
    // Then
    expect(device).toMatchObject({ name: decryptedName, bucket });
    call(aesDecryptMock).toStrictEqual([encryptedName, `${process.env.NEW_CRYPTO_KEY}-${bucket}`]);
  });

  it('should fallback to null bucket key when decryption with bucket fails', () => {
    // Given
    aesDecryptMock
      .mockImplementationOnce(() => {
        throw new Error();
      })
      .mockReturnValueOnce(decryptedName);
    // When
    const device = decryptDeviceName(props);
    // Then
    expect(device).toMatchObject({ name: decryptedName, bucket });
    calls(aesDecryptMock).toStrictEqual([
      [encryptedName, `${process.env.NEW_CRYPTO_KEY}-${bucket}`],
      [encryptedName, `${process.env.NEW_CRYPTO_KEY}-${null}`],
    ]);
  });
});
