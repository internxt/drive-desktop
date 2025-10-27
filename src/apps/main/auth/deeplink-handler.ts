import { validateMnemonic } from 'bip39';
import { logger } from '@internxt/drive-desktop-core/build/backend';
import { app } from 'electron';
import eventBus from '../event-bus';
import { setCredentials, updateCredentials } from './service';
import { setIsLoggedIn } from './handlers';
import { setupRootFolder } from '../virtual-root-folder/service';
import { User } from '../types';
import { driveServerModule } from '../../../infra/drive-server/drive-server.module';
import ConfigStore from '../config';


async function initializeCurrentUser() {
  try {
    logger.debug({ msg: 'Initializing current user...' });
    const refreshResult = await driveServerModule.auth.refresh();
    if (refreshResult.isLeft()) {
      throw new Error(`Failed to refresh user data: ${refreshResult.getLeft().message}`);
    }

    const refreshData = refreshResult.getRight();

    logger.debug({ msg: 'User data refreshed successfully', userId: refreshData.user?.userId });
    updateCredentials(refreshData.token, refreshData.newToken);

    const currentUser = ConfigStore.get('userData') as User;

    const updatedUser: User = {
      ...currentUser,
      ...refreshData.user,
      mnemonic: currentUser.mnemonic,
    };

    ConfigStore.set('userData', updatedUser);

    logger.debug({ msg: 'Current user initialized successfully', userEmail: updatedUser.email });
  } catch (error) {
    logger.error({ msg: 'Failed to initialize current user', error });
    throw error;
  }
}

export async function handleDeeplink({url}: {url: string}): Promise<boolean> {
  logger.debug({ msg: 'Processing deeplink URL', url });

  try {
    const urlObj = new URL(url);

    if (urlObj.protocol !== 'internxt:') {
      logger.debug({ msg: 'Invalid scheme, not handling', scheme: urlObj.protocol });
      return false;
    }

    if (urlObj.hostname !== 'login-success') {
      logger.debug({ msg: 'Unknown action, not handling', action: urlObj.hostname });
      return false;
    }

    logger.debug({ msg: 'Deeplink validation passed, extracting parameters' });

    const params = new URLSearchParams(urlObj.search);
    const base64Mnemonic = params.get('mnemonic');
    const base64LegacyToken = params.get('token');
    const base64Token = params.get('newToken');
    const base64PrivateKey = params.get('privateKey');

    if (!base64Mnemonic || !base64LegacyToken || !base64Token || !base64PrivateKey) {
      logger.error({
        msg: 'Missing required parameters in deeplink',
        hasM: !!base64Mnemonic,
        hasLT: !!base64LegacyToken,
        hasT: !!base64Token,
        hasPK: !!base64PrivateKey
      });
      return false;
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

      logger.debug({
        msg: 'Successfully decoded parameters',
        mnemonicWordsCount: decodedMnemonic.split(' ').length,
        decodedMnemonicPreview: decodedMnemonic.substring(0, 50) + '...',
        tokenStartsWith: decodedLegacyToken.substring(0, 20) + '...',
        newTokenStartsWith: decodedToken.substring(0, 20) + '...'
      });
    } catch (error) {
      logger.error({ msg: 'Failed to decode base64 parameters', error });
      return false;
    }

    if (!validateMnemonic(decodedMnemonic)) {
      logger.error({ msg: 'Invalid mnemonic received in deeplink' });
      return false;
    }

    logger.debug({ msg: 'Deeplink parameters validated successfully' });

    await setCredentials(
      decodedMnemonic,
      decodedLegacyToken,
      decodedToken,
    );

    logger.debug({ msg: 'Auth details stored successfully from deeplink' });

    await initializeCurrentUser();

    await setupRootFolder();

    setIsLoggedIn(true);

    app.focus();

    eventBus.emit('USER_LOGGED_IN');

    logger.debug({ msg: 'Deeplink login completed successfully' });

    return true;
  } catch (error) {
    logger.error({ msg: 'Error processing deeplink', error });
    return false;
  }
}
