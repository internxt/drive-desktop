import { validateMnemonic } from 'bip39';
import { logger } from '@internxt/drive-desktop-core/build/backend';

type Props = {
  url: string;
};

type DeeplinkParams = {
  mnemonic: string;
  token: string;
  newToken: string;
  privateKey: string;
};

export async function processDeeplink({ url }: Props) {
  try {
    const urlObj = new URL(url);

    if (urlObj.protocol !== 'internxt:') {
      logger.debug({ tag: 'AUTH', msg: 'Invalid scheme, not handling', scheme: urlObj.protocol });
      return;
    }

    if (urlObj.hostname !== 'login-success') {
      logger.debug({ tag: 'AUTH', msg: 'Unknown action, not handling', action: urlObj.hostname });
      return;
    }

    logger.debug({ tag: 'AUTH', msg: 'Deeplink validation passed, extracting parameters' });

    const params = new URLSearchParams(urlObj.search);
    const base64Mnemonic = params.get('mnemonic');
    const base64LegacyToken = params.get('token');
    const base64Token = params.get('newToken');
    const base64PrivateKey = params.get('privateKey');

    if (!base64Mnemonic || !base64LegacyToken || !base64Token || !base64PrivateKey) {
      logger.error({ tag: 'AUTH', msg: 'Missing required parameters in deeplink' });
      return;
    }

    let decodedMnemonic: string;
    let decodedLegacyToken: string;
    let decodedToken: string;
    let decodedPrivateKey: string;

    try {
      decodedMnemonic = Buffer.from(base64Mnemonic, 'base64').toString('utf8');
      decodedLegacyToken = Buffer.from(base64LegacyToken, 'base64').toString('utf8');
      decodedToken = Buffer.from(base64Token, 'base64').toString('utf8');
      decodedPrivateKey = Buffer.from(base64PrivateKey, 'base64').toString('utf8');
    } catch (error) {
      logger.error({ tag: 'AUTH', msg: 'Failed to decode base64 parameters', error });
      return;
    }

    if (!validateMnemonic(decodedMnemonic)) {
      logger.error({ tag: 'AUTH', msg: 'Invalid mnemonic received in deeplink' });
      return;
    }

    logger.debug({ tag: 'AUTH', msg: 'Deeplink parameters validated successfully' });
    return {
      mnemonic: decodedMnemonic,
      token: decodedLegacyToken,
      newToken: decodedToken,
      privateKey: decodedPrivateKey,
    } as DeeplinkParams;
  } catch (error) {
    logger.error({ tag: 'AUTH', msg: 'Error processing deeplink', error });
    return;
  }
}
