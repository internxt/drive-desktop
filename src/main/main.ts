import 'reflect-metadata';
import 'core-js/stable';
import 'regenerator-runtime/runtime';

// Only effective during development
// the variables are injectedif (process.env.NODE_ENV === 'production') {

// via webpack in prod
import 'dotenv/config';
// ***** APP BOOTSTRAPPING ****************************************************** //
import './sync-root-folder/handlers';
import './auto-launch/handlers';
import './logger';
import './bug-report/handlers';
import './auth/handlers';
import './windows/settings';
import './windows/process-issues';
import './windows';
import './background-processes/backups';
import './background-processes/sync';
import './background-processes/webdav';
import './background-processes/process-issues';
import './device/handlers';
import './usage/handlers';
import './realtime';
import './tray';
import './analytics/handlers';
import './platform/handlers';
import './thumbnails/handlers';
import './migration/handlers';
import './config/handlers';
import './app-info/handlers';
import { unmountDrive } from '../workers/webdav/VirtualDrive';
import './remote-sync/handlers';
import { app, ipcMain } from 'electron';
import Logger from 'electron-log';
import { autoUpdater } from 'electron-updater';

import packageJson from '../../package.json';
import eventBus from './event-bus';
import * as Sentry from '@sentry/electron/main';
import { AppDataSource } from './database/data-source';
import { getIsLoggedIn } from './auth/handlers';
import {
  createWidget,
  getWidget,
  setBoundsOfWidgetByPath,
} from './windows/widget';
import { createAuthWindow, getAuthWindow } from './windows/auth';
import configStore from './config';
import { getTray } from './tray';
import { openOnboardingWindow } from './windows/onboarding';
import { reportError } from './bug-report/service';

Logger.log(`Running ${packageJson.version}`);

Logger.log('Initializing Sentry for main process');
if (process.env.SENTRY_DSN) {
  Sentry.init({
    // Enable Sentry only when app is packaged
    enabled: app.isPackaged,
    dsn: process.env.SENTRY_DSN,
  });
  Logger.log('Sentry is ready for main process');
} else {
  Logger.error('Sentry DSN not found, cannot initialize Sentry');
}

function checkForUpdates() {
  autoUpdater.logger = Logger;
  autoUpdater.checkForUpdatesAndNotify();
}

if (process.platform === 'darwin') {
  app.dock.hide();
}

if (process.env.NODE_ENV === 'production') {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

if (process.env.NODE_ENV === 'development') {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  require('electron-debug')({ showDevTools: false });
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  require('./dev/handlers');
}

const installExtensions = async () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS'];

  return installer
    .default(
      extensions.map((name) => installer[name]),
      forceDownload
    )
    .catch(console.log);
};

app.on('will-quit', () => {
  unmountDrive().catch((error) => {
    Logger.error(error);
    reportError(error);
  });
});

app.on('window-all-closed', () => {
  unmountDrive().catch((error) => {
    Logger.error(error);
    reportError(error);
  });
  app.quit();
});

ipcMain.on('user-quit', () => {
  app.quit();
});

app
  .whenReady()
  .then(async () => {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
    eventBus.emit('APP_IS_READY');
    const isLoggedIn = getIsLoggedIn();

    if (!isLoggedIn) {
      await createAuthWindow();
    }
    if (process.env.NODE_ENV === 'development') {
      await installExtensions();
    }
    checkForUpdates();
  })
  .catch(Logger.error);

eventBus.on('USER_LOGGED_IN', async () => {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
    getAuthWindow()?.destroy();
    await createWidget();
    const widget = getWidget();
    const tray = getTray();
    if (widget && tray) {
      setBoundsOfWidgetByPath(widget, tray);
    }

    const lastOnboardingShown = configStore.get('lastOnboardingShown');

    if (!lastOnboardingShown) {
      openOnboardingWindow();
    } else if (widget) {
      widget.show();
    }
  } catch (error) {
    reportError(error as Error);
  }
});

eventBus.on('USER_LOGGED_OUT', async () => {
  const widget = getWidget();
  if (widget) {
    widget.hide();
    widget.destroy();
  }

  await createAuthWindow();
  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy();
  }
});
