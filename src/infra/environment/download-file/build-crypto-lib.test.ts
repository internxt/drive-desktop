import { Network } from '@internxt/sdk';
import { Environment } from '@internxt/inxt-js';
import { validateMnemonic } from 'bip39';
import { buildCryptoLib } from './build-crypto-lib';

vi.mock('@internxt/sdk', () => ({
  Network: {
    ALGORITHMS: {
      AES256CTR: 'aes-256-ctr',
    },
  },
}));

vi.mock('@internxt/inxt-js', () => ({
  Environment: {
    utils: {
      generateFileKey: vi.fn(() => Buffer.from('file-key')),
    },
  },
}));

vi.mock('bip39', () => ({
  validateMnemonic: vi.fn(),
}));

const validateMnemonicMock = vi.mocked(validateMnemonic);
const generateFileKeyMock = vi.mocked(Environment.utils.generateFileKey);

describe('buildCryptoLib', () => {
  it('uses AES-256-CTR as the crypto algorithm', () => {
    const cryptoLib = buildCryptoLib();

    expect(cryptoLib.algorithm).toBe(Network.ALGORITHMS.AES256CTR);
  });

  it('delegates mnemonic validation to bip39', () => {
    validateMnemonicMock.mockReturnValue(true);
    const cryptoLib = buildCryptoLib();

    const result = cryptoLib.validateMnemonic('seed phrase');

    expect(result).toBe(true);
    expect(validateMnemonicMock).toHaveBeenCalledWith('seed phrase');
  });

  it('delegates file-key generation to Environment utils', () => {
    const index = Buffer.from('index');
    const cryptoLib = buildCryptoLib();

    const result = cryptoLib.generateFileKey('mnemonic', 'bucket-id', index);

    expect(result).toStrictEqual(Buffer.from('file-key'));
    expect(generateFileKeyMock).toHaveBeenCalledWith('mnemonic', 'bucket-id', index);
  });

  it('exposes randomBytes from node crypto', () => {
    const cryptoLib = buildCryptoLib();

    expect(cryptoLib.randomBytes(8)).toHaveLength(8);
  });
});
