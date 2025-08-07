import { User } from '@/apps/main/types';
import { aes } from '@internxt/lib';
import { logger } from '../logger/logger';
const MINIMAL_ENCRYPTED_KEY_LEN = 129;

function decryptPrivateKey(privateKey: string, password: string): string {
  if (!privateKey || privateKey.length <= MINIMAL_ENCRYPTED_KEY_LEN) return '';
  else {
    try {
      const result = aes.decrypt(privateKey, password);
      return result;
    } catch (exc) {
      throw logger.error({ msg: 'Error decrypting private key', exc });
    }
  }
}

export function parseAndDecryptUserKeys(
  user: User,
  password: string,
): { publicKey: string; privateKey: string; publicKyberKey: string; privateKyberKey: string } {
  const decryptedPrivateKey = decryptPrivateKey(user.privateKey, password);
  const privateKey = Buffer.from(decryptedPrivateKey).toString('base64');

  const privateKyberKey = decryptPrivateKey(user.keys.kyber.privateKey, password);

  const publicKey = user.keys.ecc.publicKey;
  const publicKyberKey = user.keys.kyber.publicKey;

  return { publicKey, privateKey, publicKyberKey, privateKyberKey };
}
