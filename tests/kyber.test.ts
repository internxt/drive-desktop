/**
 * Unit tests for the KyberCrypto class.
 */

import KyberCrypto, {
  KyberKeys,
} from '../src/context/shared/infrastructure/kyber-encryption';

describe('KyberCrypto', () => {
  let kyber: KyberCrypto;

  beforeEach(async () => {
    kyber = new KyberCrypto();
    await kyber.initialize();
  });

  test('should initialize Kyber instance correctly', async () => {
    expect(kyber).toBeDefined();
  });

  test('should generate a valid keypair', async () => {
    const keys: KyberKeys = await kyber.generateKeyPair();
    expect(keys.publicKey).toBeDefined();
    expect(keys.privateKey).toBeDefined();
    expect(keys.publicKey.length).toBeGreaterThan(0);
    expect(keys.privateKey.length).toBeGreaterThan(0);
  });

  test('should encrypt and decrypt data correctly', async () => {
    const keys: KyberKeys = await kyber.generateKeyPair();
    const publicKey = keys.publicKey;
    const privateKey = keys.privateKey;

    const message = 'Hello, Kyber!';
    const encodedMessage = new TextEncoder().encode(message);

    const { encryptedData, secret } = await kyber.encrypt(publicKey);
    expect(encryptedData).toBeDefined();
    expect(secret).toBeDefined();

    const decryptedMessage = await kyber.decrypt(encryptedData, privateKey);
    expect(decryptedMessage).toBe(message);
  });

  test('should throw an error when using uninitialized Kyber instance', async () => {
    const uninitializedKyber = new KyberCrypto();

    await expect(uninitializedKyber.generateKeyPair()).rejects.toThrow(
      'Kyber instance not initialized. Call `initialize()` first.'
    );
  });

  test('should validate public key correctly', async () => {
    const validPublicKey = new Uint8Array([1, 2, 3, 4, 5]);
    const isValid = await kyber.verifyKey(validPublicKey);
    expect(isValid).toBe(true);

    const invalidPublicKey = new Uint8Array([]);
    await expect(kyber.verifyKey(invalidPublicKey)).rejects.toThrow(
      'Invalid public key provided.'
    );
  });

  test('should check key expiration', async () => {
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    const isExpired = await kyber.isKeyExpired(oneYearAgo);
    expect(isExpired).toBe(false);

    const twoYearsAgo = new Date();
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
    const isExpiredTwoYears = await kyber.isKeyExpired(twoYearsAgo);
    expect(isExpiredTwoYears).toBe(true);
  });
});
