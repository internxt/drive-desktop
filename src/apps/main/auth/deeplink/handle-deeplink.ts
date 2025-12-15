import { logger } from '@internxt/drive-desktop-core/build/backend';
import { app } from 'electron';
import eventBus from '../../event-bus';
import { setCredentials } from '../service';
import { setIsLoggedIn } from '../handlers';
import { setupRootFolder } from '../../virtual-root-folder/service';
import { processDeeplink } from './proccess-deeplink';
import { initializeCurrentUser } from './initialize_current_user';

type Props = {
  url: string;
};

export async function handleDeeplink({ url }: Props) {
  try {
    const deeplinkParams = await processDeeplink({ url });

    if (!deeplinkParams) {
      logger.error({ tag: 'AUTH', msg: 'Invalid deeplink parameters', url });
      return false;
    }

    await setCredentials(deeplinkParams.mnemonic, deeplinkParams.token, deeplinkParams.newToken);

    logger.debug({ tag: 'AUTH', msg: 'Auth details stored successfully from deeplink' });

    await initializeCurrentUser();

    await setupRootFolder();

    setIsLoggedIn(true);

    app.focus();

    eventBus.emit('USER_LOGGED_IN');

    logger.debug({ tag: 'AUTH', msg: 'Deeplink login completed successfully' });

    return true;
  } catch (error) {
    logger.error({ tag: 'AUTH', msg: 'Error processing deeplink', error });
    return false;
  }
}
