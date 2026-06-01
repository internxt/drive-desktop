import { app } from 'electron';
import { logger } from '@internxt/drive-desktop-core/build/backend';
import { handleDeeplink } from '../../apps/main/auth/deeplink/handle-deeplink';

export function registerSecondInstanceFlow() {
  app.on('second-instance', async (_, argv) => {
    logger.debug({ tag: 'AUTH', msg: 'Deeplink received on second instance, processing...' });
    const deeplinkArg = argv.find((arg) => arg.startsWith('internxt://'));
    if (!deeplinkArg) {
      return;
    }

    try {
      await handleDeeplink({ url: deeplinkArg });
    } catch (error) {
      logger.error({ tag: 'AUTH', msg: 'Error handling deeplink', error });
    }
  });
}
