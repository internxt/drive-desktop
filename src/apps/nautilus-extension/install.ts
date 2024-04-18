import * as Sentry from '@sentry/electron/main';
import Logger from 'electron-log';
import { copyNautilusExtensionFile } from './service';

export async function installNautilusExtension() {
  try {
    await copyNautilusExtensionFile();
    Logger.info('[NAUTILUS EXTENSION] Extension Installed');
  } catch (error) {
    Logger.error(error);
    Sentry.captureException(error);
  }
}
