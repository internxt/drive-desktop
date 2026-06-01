import { Network } from '@internxt/sdk';
import { validateMnemonic } from 'bip39';
import { Environment } from '@internxt/inxt-js';
import { randomBytes } from 'node:crypto';

export function buildCryptoLib(): Network.Crypto {
  return {
    algorithm: Network.ALGORITHMS.AES256CTR,
    validateMnemonic: (mnemonic: string) => validateMnemonic(mnemonic),
    generateFileKey: (mnemonic, bucketId, index) =>
      Environment.utils.generateFileKey(mnemonic, bucketId, index as Buffer),
    randomBytes,
  };
}
