import { loggerMock } from 'tests/vitest/mocks.helper.test';
import * as crypt from './crypt';

describe('crypt', () => {
  const parentId = 107892578;
  const encryptedName =
    'y9Nrn9hc7YYcmfs6iwFIS1428sb//H3RswFI6kIslX2CS2GFNq7wiMDuDsu0cGf4aF8HHNsiQW3qQ9UyRElfGPmodc/dshdjH0URHd2u4123mVWkWeuO0gJnz2Ygg2QBqNAkQW6+';

  describe('decryptName', () => {
    it('When decrypt successfully it gives the name without the extension', () => {
      // When
      const name = crypt.decryptName({ encryptedName, parentId });
      // Then
      expect(name).toBe('latest');
    });

    it('When no parentId is provided it throws an error', () => {
      // When
      expect(() => crypt.decryptName({ encryptedName })).toThrowError();
      // Then
      expect(loggerMock.error).toHaveBeenCalledWith({
        msg: 'AES Decrypt failed because parentId is null',
        encryptedName,
      });
    });

    it('When decrypt fails it throws an error', () => {
      // When and Then
      expect(() =>
        crypt.decryptName({
          encryptedName: 'invalid',
          parentId,
        }),
      ).toThrowError();
    });
  });
});
