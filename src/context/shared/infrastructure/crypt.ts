import { logger } from '@/apps/shared/logger/logger';
import { aes } from '@internxt/lib';

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
    const password = `${process.env.NEW_CRYPTO_KEY}-${salt}`;
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
