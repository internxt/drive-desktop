import { safeStorage } from 'electron';
import { getCredentials } from './get-credentials';
import ConfigStore, { AppStore } from '../config';
import { calls, call, partialSpyOn } from 'tests/vitest/utils.helper';
import { loggerMock } from 'tests/vitest/mocks.helper';

describe('getCredentials', () => {
  const configGetMock = partialSpyOn(ConfigStore, 'get');
  const safeStorageIsAvailableMock = partialSpyOn(safeStorage, 'isEncryptionAvailable');
  const safeStorageDecryptMock = partialSpyOn(safeStorage, 'decryptString');

  const plainToken = 'plain-token-123';
  const plainMnemonic = 'plain mnemonic words here';
  const encryptedToken = 'encrypted-token-base64';
  const encryptedMnemonic = 'encrypted-mnemonic-base64';

  describe('when neither token nor mnemonic are encrypted', () => {
    it('should return plaintext values without decryption', () => {
      configGetMock.mockImplementation((key: keyof AppStore) => {
        const values: Record<string, unknown> = {
          newToken: plainToken,
          mnemonic: plainMnemonic,
          newTokenEncrypted: false,
          mnemonicEncrypted: false,
        };
        return values[key] as AppStore[keyof AppStore];
      });

      const result = getCredentials();

      expect(result).toMatchObject({
        newToken: plainToken,
        mnemonic: plainMnemonic,
      });
      calls(safeStorageIsAvailableMock).toHaveLength(0);
      calls(safeStorageDecryptMock).toHaveLength(0);
    });
  });

  describe('when both token and mnemonic are encrypted', () => {
    it('should decrypt both values', () => {
      configGetMock.mockImplementation((key: keyof AppStore) => {
        const values: Record<string, unknown> = {
          newToken: encryptedToken,
          mnemonic: encryptedMnemonic,
          newTokenEncrypted: true,
          mnemonicEncrypted: true,
        };
        return values[key] as AppStore[keyof AppStore];
      });

      safeStorageIsAvailableMock.mockReturnValue(true);
      safeStorageDecryptMock.mockImplementation((buffer: Buffer) => {
        const str = buffer.toString('latin1');
        if (str === encryptedToken) return plainToken;
        if (str === encryptedMnemonic) return plainMnemonic;
        return '';
      });

      const result = getCredentials();

      expect(result).toMatchObject({
        newToken: plainToken,
        mnemonic: plainMnemonic,
      });
      calls(safeStorageIsAvailableMock).toHaveLength(1);
      calls(safeStorageDecryptMock).toHaveLength(2);
    });
  });

  describe('when only token is encrypted', () => {
    it('should decrypt token and return plaintext mnemonic', () => {
      configGetMock.mockImplementation((key: keyof AppStore) => {
        const values: Record<string, unknown> = {
          newToken: encryptedToken,
          mnemonic: plainMnemonic,
          newTokenEncrypted: true,
          mnemonicEncrypted: false,
        };
        return values[key] as AppStore[keyof AppStore];
      });

      safeStorageIsAvailableMock.mockReturnValue(true);
      safeStorageDecryptMock.mockReturnValue(plainToken);

      const result = getCredentials();

      expect(result).toMatchObject({
        newToken: plainToken,
        mnemonic: plainMnemonic,
      });
      calls(safeStorageDecryptMock).toHaveLength(1);
    });
  });

  describe('when only mnemonic is encrypted', () => {
    it('should decrypt mnemonic and return plaintext token', () => {
      configGetMock.mockImplementation((key: keyof AppStore) => {
        const values: Record<string, unknown> = {
          newToken: plainToken,
          mnemonic: encryptedMnemonic,
          newTokenEncrypted: false,
          mnemonicEncrypted: true,
        };
        return values[key] as AppStore[keyof AppStore];
      });

      safeStorageIsAvailableMock.mockReturnValue(true);
      safeStorageDecryptMock.mockReturnValue(plainMnemonic);

      const result = getCredentials();

      expect(result).toMatchObject({
        newToken: plainToken,
        mnemonic: plainMnemonic,
      });
      calls(safeStorageDecryptMock).toHaveLength(1);
    });
  });

  describe('when safeStorage is not available', () => {
    it('should return empty values and log warning', () => {
      configGetMock.mockImplementation((key: keyof AppStore) => {
        const values: Record<string, unknown> = {
          newToken: encryptedToken,
          mnemonic: encryptedMnemonic,
          newTokenEncrypted: true,
          mnemonicEncrypted: true,
        };
        return values[key] as AppStore[keyof AppStore];
      });

      safeStorageIsAvailableMock.mockReturnValue(false);

      const result = getCredentials();

      expect(result).toMatchObject({
        newToken: '',
        mnemonic: '',
      });
      call(loggerMock.warn).toMatchObject({
        msg: '[AUTH] Safe Storage was not available when decrypting encrypted token, falling back to logged-out state',
        tag: 'AUTH',
      });
      calls(safeStorageDecryptMock).toHaveLength(0);
    });
  });

  describe('when decryption fails', () => {
    it('should return empty values and log warning', () => {
      configGetMock.mockImplementation((key: keyof AppStore) => {
        const values: Record<string, unknown> = {
          newToken: encryptedToken,
          mnemonic: encryptedMnemonic,
          newTokenEncrypted: true,
          mnemonicEncrypted: true,
        };
        return values[key] as AppStore[keyof AppStore];
      });

      safeStorageIsAvailableMock.mockReturnValue(true);
      const decryptError = new Error('Decryption failed');
      safeStorageDecryptMock.mockImplementation(() => {
        throw decryptError;
      });

      const result = getCredentials();

      expect(result).toMatchObject({
        newToken: '',
        mnemonic: '',
      });
      call(loggerMock.debug).toMatchObject({
        msg: '[AUTH] Failed to decrypt token, falling back to logged-out state',
        tag: 'AUTH',
        error: decryptError,
      });
    });
  });

  describe('edge cases', () => {
    it('should handle empty strings', () => {
      configGetMock.mockImplementation((key: keyof AppStore) => {
        const values: Record<string, unknown> = {
          newToken: '',
          mnemonic: '',
          newTokenEncrypted: false,
          mnemonicEncrypted: false,
        };
        return values[key] as AppStore[keyof AppStore];
      });

      const result = getCredentials();

      expect(result).toMatchObject({
        newToken: '',
        mnemonic: '',
      });
    });

    it('should properly encode Buffer with latin1 encoding', () => {
      const testToken = 'test-token-with-special-chars';

      configGetMock.mockImplementation((key: keyof AppStore) => {
        const values: Record<string, unknown> = {
          newToken: testToken,
          mnemonic: plainMnemonic,
          newTokenEncrypted: true,
          mnemonicEncrypted: false,
        };
        return values[key] as AppStore[keyof AppStore];
      });

      safeStorageIsAvailableMock.mockReturnValue(true);
      safeStorageDecryptMock.mockImplementation((buffer: Buffer) => {
        expect(buffer.toString('latin1')).toBe(testToken);
        return 'decrypted-token';
      });

      getCredentials();

      call(safeStorageDecryptMock).toMatchObject(expect.any(Buffer));
    });
  });
});
