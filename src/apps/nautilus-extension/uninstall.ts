import * as Sentry from '@sentry/electron/main';
import Logger from 'electron-log';
import { deleteNautilusExtensionFile } from './service';

export async function uninstallNautilusExtension() {
  try {
    await deleteNautilusExtensionFile();
    Logger.info('[NAUTILUS EXTENSION] Extension uninstalled');
  } catch (error) {
    Logger.error(error);
    Sentry.captureException(error);
  }
}
