import * as Sentry from '@sentry/electron/main';
import { logger } from '@internxt/drive-desktop-core/build/backend';
import {
  copyNautilusExtensionFile,
  deleteNautilusExtensionFile,
  isInstalled,
  reloadNautilus,
} from './service';

import configStore from '../config';
import { LATEST_NAUTILUS_EXTENSION_VERSION } from './version';

function isUpToDate(): boolean {
  const nautilusExtensionInstalledAt = configStore.get(
    'nautilusExtensionVersion'
  );

  if (process.env.NODE_ENV !== 'production') {
    return false;
  }

  return nautilusExtensionInstalledAt >= LATEST_NAUTILUS_EXTENSION_VERSION;
}

async function install(): Promise<void> {
  await copyNautilusExtensionFile();

  configStore.set(
    'nautilusExtensionVersion',
    LATEST_NAUTILUS_EXTENSION_VERSION
  );

  logger.debug({
    msg: `[NAUTILUS EXTENSION] Extension Installed with version #${LATEST_NAUTILUS_EXTENSION_VERSION}`,
  });
}

export async function installNautilusExtension() {
  try {
    const installed = await isInstalled();
    const hasLatestsVersion = isUpToDate();

    if (!installed) {
      await install();
      await reloadNautilus().catch((reloadError) => {
        logger.error({
          msg: 'catched error while reloading nautilus extension',
          error: reloadError,
        });
        Sentry.captureException(reloadError);
      });
      return;
    }

    if (installed && !hasLatestsVersion) {
      logger.debug({
        msg: '[NAUTILUS EXTENSION] There is a newer version to be installed',
      });
      await deleteNautilusExtensionFile();
      await install();

      return;
    }

    logger.debug({
      msg: '[NAUTILUS EXTENSION] Extension already installed with the version',
    });
  } catch (error) {
    logger.error({
      msg: '[NAUTILUS EXTENSION] Error while installing Nautilus extension: ',
      error,
    });
    Sentry.captureException(error);
  }
}
