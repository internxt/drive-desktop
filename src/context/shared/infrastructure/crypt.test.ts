import { loggerMock } from 'tests/vitest/mocks.helper.test';
import * as crypt from './crypt';

describe('crypt', () => {
  const encryptedName =
    '9u+sGySbQbFq1JOg26ssR/qfjMfTGvz3TXLy2uRIK1/4lOlfoZfpaNM0+kH8+Re+LCeW5q7PXCDXBfmV/p+tee3vBaddvXqkxMKm8LQbc/WzS+6+cIpryXsRC9Q/CIUwPSJNfxGK';

  describe('decryptName', () => {
    it('When decrypt successfully it gives the name without the extension', () => {
      const name = crypt.decryptName({
        name: encryptedName,
        parentId: 107892578,
      });

      expect(name).toBe('latest');
    });

    it('When no parentId is provided it throws an error', () => {
      expect(() => crypt.decryptName({ name: encryptedName })).toThrowError();
      expect(loggerMock.error).toHaveBeenCalledWith({
        msg: 'AES Decrypt failed because parentId is null',
        name: encryptedName,
      });
    });

    it('When decrypt fails it throws an error', () => {
      expect(() =>
        crypt.decryptName({
          name: 'invalid',
          parentId: 107892578,
        }),
      ).toThrowError();
    });
  });

  describe('encryptName', () => {
    it('When encrypt successfully it gives the name without the extension', () => {
      const name = crypt.encryptName({
        name: 'latest',
        parentId: 107892578,
      });

      expect(name).toHaveLength(136);
    });

    it('When no parentId is provided it throws an error', () => {
      expect(() =>
        crypt.encryptName({
          name: 'latest',
        }),
      ).toThrowError();
    });
  });
});
