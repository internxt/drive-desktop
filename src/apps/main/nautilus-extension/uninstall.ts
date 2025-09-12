import * as Sentry from '@sentry/electron/main';
import { logger } from '@internxt/drive-desktop-core/build/backend';
import { deleteNautilusExtensionFile } from './service';

import configStore, { defaults } from '../config';

export async function uninstallNautilusExtension() {
  try {
    await deleteNautilusExtensionFile();

    configStore.set(
      'nautilusExtensionVersion',
      defaults['nautilusExtensionVersion']
    );

    logger.debug({ msg: '[NAUTILUS EXTENSION] Extension uninstalled' });
  } catch (error) {
    logger.error({
      msg: 'Error while uninstalling Nautilus extension: ',
      error,
    });
    Sentry.captureException(error);
  }
}
