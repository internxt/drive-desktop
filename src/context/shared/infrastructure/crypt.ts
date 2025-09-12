import { aes } from '@internxt/lib';
import CryptoJS from 'crypto-js';
import { logger } from '@internxt/drive-desktop-core/build/backend';

// Webpack dotenv plugin won't replace if you destructure
// eslint-disable-next-line prefer-destructuring
const CRYPTO_KEY = process.env.NEW_CRYPTO_KEY;

if (!CRYPTO_KEY) {
  logger.error({ msg: 'No encryption key provided' });
  throw Error('No encryption key provided');
}

function deterministicDecryption(cipherText: string, salt: string) {
  try {
    const key = CryptoJS.enc.Hex.parse(CRYPTO_KEY);
    const iv = salt ? CryptoJS.enc.Hex.parse(salt.toString()) : key;

    const reb64 = CryptoJS.enc.Hex.parse(cipherText);
    const bytes = reb64.toString(CryptoJS.enc.Base64);
    const decrypt = CryptoJS.AES.decrypt(bytes, key, { iv });
    const plain = decrypt.toString(CryptoJS.enc.Utf8);

    return plain;
  } catch (e) {
    return null;
  }
}

function decryptName(cipherText: string, salt: string, encryptVersion: string) {
  if (!salt) {
    // If no salt, something is trying to use legacy decryption
    return probabilisticDecryption(cipherText);
  }
  try {
    const possibleAesResult = aes.decrypt(cipherText, `${CRYPTO_KEY}-${salt}`);

    return possibleAesResult;
  } catch (e) {
    logger.warn({
      msg: 'AES Decrypt failed',
      cipher: cipherText,
      salt: salt,
      message: (e as Error).message,
      encryptVersion: encryptVersion,
      stack: (e as Error).stack
    });
  }
  const decrypted = deterministicDecryption(cipherText, salt);

  if (!decrypted) {
    logger.warn({ msg: 'Error decrypting on a deterministic way' });

    return probabilisticDecryption(cipherText);
  }

  return decrypted;
}

function probabilisticDecryption(cipherText: string) {
  try {
    const reb64 = CryptoJS.enc.Hex.parse(cipherText);
    const bytes = reb64.toString(CryptoJS.enc.Base64);
    const decrypt = CryptoJS.AES.decrypt(bytes, CRYPTO_KEY);
    const plain = decrypt.toString(CryptoJS.enc.Utf8);

    return plain;
  } catch (error) {
    return null;
  }
}

function probabilisticEncryption(content: string) {
  try {
    const b64 = CryptoJS.AES.encrypt(content, CRYPTO_KEY).toString();
    const e64 = CryptoJS.enc.Base64.parse(b64);
    const eHex = e64.toString(CryptoJS.enc.Hex);

    return eHex;
  } catch (error) {
    return null;
  }
}

function encryptName(name: string, salt: string) {
  if (!salt) {
    // If no salt, somewhere is trying to use legacy encryption
    return probabilisticEncryption(name);
  }

  // If salt is provided, use new deterministic encryption
  return aes.encrypt(name, `${CRYPTO_KEY}-${salt}`);
}

export default {
  decryptName,
  encryptName,
};
