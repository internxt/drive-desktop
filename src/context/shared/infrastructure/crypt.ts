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

function decryptName(cipherText: string, salt?: string, encryptVersion?: string) {
  if (!salt) {
    throw logger.error({
      msg: 'AES Decrypt failed because parentId is null',
      cipherText,
    });
  }

  try {
    return aes.decrypt(cipherText, `${CRYPTO_KEY}-${salt}`);
  } catch (e) {
    throw logger.error({
      msg: 'AES Decrypt failed',
      cipher: cipherText,
      salt: salt,
      message: (e as Error).message,
      encryptVersion: encryptVersion,
      stack: (e as Error).stack,
    });
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
