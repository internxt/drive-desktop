import * as Sentry from '@sentry/electron/main';
import Logger from 'electron-log';
import { deleteNautilusExtensionFile } from './service';

import configStore, { defaults } from '../config';

export async function uninstallNautilusExtension() {
  try {
    await deleteNautilusExtensionFile();

    configStore.set(
      'nautilusExtensionVersion',
      defaults['nautilusExtensionVersion']
    );

    Logger.info('[NAUTILUS EXTENSION] Extension uninstalled');
  } catch (error) {
    Logger.error(error);
    Sentry.captureException(error);
  }
}
