import * as Sentry from '@sentry/electron/main';
import Logger from 'electron-log';
import {
  copyNautilusExtensionFile,
  deleteNautilusExtensionFile,
  isInstalled,
} from './service';

import configStore from '../config';
import { LATEST_NAUTILUS_EXTENSION_VERSION } from './version';

function isUpToDate(): boolean {
  const nautilusExtensionInstalledAt = configStore.get(
    'nautilusExtensionVersion'
  );

  return nautilusExtensionInstalledAt >= LATEST_NAUTILUS_EXTENSION_VERSION;
}

async function install() {
  await copyNautilusExtensionFile();

  configStore.set(
    'nautilusExtensionVersion',
    LATEST_NAUTILUS_EXTENSION_VERSION
  );

  Logger.info(
    '[NAUTILUS EXTENSION] Extension Installed with version #',
    LATEST_NAUTILUS_EXTENSION_VERSION
  );
}

export async function installNautilusExtension() {
  try {
    const installed = await isInstalled();
    const hasLatestsVersion = isUpToDate();

    if (!installed) {
      await install();
      return;
    }

    if (installed && !hasLatestsVersion) {
      Logger.info(
        '[NAUTILUS EXTENSION] There is a newer version to be installed'
      );
      await deleteNautilusExtensionFile();
      await install();

      return;
    }

    Logger.info(
      '[NAUTILUS EXTENSION] Extension already installed with the version'
    );
  } catch (error) {
    Logger.error(error);
    Sentry.captureException(error);
  }
}
