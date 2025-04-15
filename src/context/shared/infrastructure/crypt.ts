import { logger } from '@/apps/shared/logger/logger';
import { aes } from '@internxt/lib';
import CryptoJS from 'crypto-js';

// Webpack dotenv plugin won't replace if you destructure
// eslint-disable-next-line prefer-destructuring
const CRYPTO_KEY = process.env.NEW_CRYPTO_KEY;

function deterministicDecryption(cipherText: string, salt: string) {
  const key = CryptoJS.enc.Hex.parse(CRYPTO_KEY);
  const iv = salt ? CryptoJS.enc.Hex.parse(salt.toString()) : key;

  const reb64 = CryptoJS.enc.Hex.parse(cipherText);
  const bytes = reb64.toString(CryptoJS.enc.Base64);
  const decrypt = CryptoJS.AES.decrypt(bytes, key, { iv });
  const plain = decrypt.toString(CryptoJS.enc.Utf8);

  return plain;
}

function decryptName({ name, parentId }: { name: string; parentId?: number | null }) {
  if (parentId) {
    const salt = parentId.toString();
    const password = `${CRYPTO_KEY}-${salt}`;

    try {
      return aes.decrypt(name, password);
    } catch (exc) {
      logger.error({
        msg: 'AES Decrypt failed',
        name,
        salt,
        exc,
      });
    }

    try {
      return deterministicDecryption(name, salt);
    } catch (exc) {
      logger.error({
        msg: 'Deterministic decryption failed',
        name,
        exc,
      });
    }
  }

  try {
    return probabilisticDecryption(name);
  } catch (exc) {
    throw logger.error({
      msg: 'Probabilistic decryption failed',
      name,
      exc,
    });
  }
}

function probabilisticDecryption(cipherText: string) {
  const reb64 = CryptoJS.enc.Hex.parse(cipherText);
  const bytes = reb64.toString(CryptoJS.enc.Base64);
  const decrypt = CryptoJS.AES.decrypt(bytes, CRYPTO_KEY);
  const plain = decrypt.toString(CryptoJS.enc.Utf8);

  return plain;
}

function probabilisticEncryption(content: string) {
  const b64 = CryptoJS.AES.encrypt(content, CRYPTO_KEY).toString();
  const e64 = CryptoJS.enc.Base64.parse(b64);
  const eHex = e64.toString(CryptoJS.enc.Hex);

  return eHex;
}

function encryptName({ name, parentId }: { name: string; parentId?: number | null }) {
  try {
    if (!parentId) {
      // If no parentId, somewhere is trying to use legacy encryption
      return probabilisticEncryption(name);
    }

    const salt = parentId.toString();
    const password = `${CRYPTO_KEY}-${salt}`;
    return aes.encrypt(name, password);
  } catch (exc) {
    throw logger.error({
      msg: 'AES Encrypt failed',
      name,
      parentId,
      exc,
    });
  }
}

export default {
  decryptName,
  encryptName,
};
