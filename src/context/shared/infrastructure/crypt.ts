import { logger } from '@/apps/shared/logger/logger';
import { aes } from '@internxt/lib';

// Webpack dotenv plugin won't replace if you destructure
// eslint-disable-next-line prefer-destructuring
const CRYPTO_KEY = process.env.NEW_CRYPTO_KEY;

export function decryptName({ encryptedName, parentId }: { encryptedName: string; parentId?: number | null }) {
  /**
   * v2.5.2 Daniel Jiménez
   * parentId can only be null for the root folder, so it should never reach here
   */
  if (!parentId) {
    throw logger.error({
      msg: 'AES Decrypt failed because parentId is null',
      encryptedName,
    });
  }

  try {
    const salt = parentId.toString();
    const password = `${CRYPTO_KEY}-${salt}`;
    return aes.decrypt(encryptedName, password);
  } catch (exc) {
    throw logger.error({
      msg: 'AES Decrypt failed',
      encryptedName,
      parentId,
      exc,
    });
  }
}

export function encryptName({ name, parentId }: { name: string; parentId?: number | null }) {
  /**
   * v2.5.2 Daniel Jiménez
   * parentId can only be null for the root folder, so it should never reach here
   */
  if (!parentId) {
    throw logger.error({
      msg: 'AES Encrypt failed because parentId is null',
      name,
    });
  }

  try {
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
