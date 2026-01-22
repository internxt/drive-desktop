import 'reflect-metadata';
import 'core-js/stable';
import 'regenerator-runtime/runtime';

// Only effective during development
// the variables are injectedif (process.env.NODE_ENV === 'production') {

// via webpack in prod
import 'dotenv/config';
// ***** APP BOOTSTRAPPING ****************************************************** //
import { PATHS } from '../../core/electron/paths';
import { setupElectronLog } from '@internxt/drive-desktop-core/build/backend';

setupElectronLog({
  logsPath: PATHS.LOGS,
});
import './virtual-root-folder/handlers';
import './auto-launch/handlers';
import './auth/handlers';
import '../../infra/ipc/files-ipc-handlers';
import '../../infra/ipc/folders-ipc-handlers';
import './windows/settings';
import './windows/process-issues';
import './windows';
import './issues/virtual-drive';
import './device/handlers';
import './../../backend/features/usage/handlers/handlers';
import './realtime';
import './tray/tray';
import './tray/handlers';
import './fordwardToWindows';
import './analytics/handlers';
import './platform/handlers';
import './config/handlers';
import './app-info/handlers';
import './remote-sync/handlers';
import './../../backend/features/cleaner/ipc/handlers';
import './virtual-drive';

import { app, nativeTheme, ipcMain } from 'electron';
import { autoUpdater } from 'electron-updater';
import eventBus from './event-bus';
import { AppDataSource } from './database/data-source';
import { getIsLoggedIn } from './auth/handlers';
import { getOrCreateWidged, getWidget, setBoundsOfWidgetByPath } from './windows/widget';
import { createAuthWindow, getAuthWindow } from './windows/auth';
import configStore from './config';
import { getTray, setTrayStatus } from './tray/tray';
import { openOnboardingWindow } from './windows/onboarding';
import { Theme } from '../shared/types/Theme';
import { installNautilusExtension } from './nautilus-extension/install';
import { uninstallNautilusExtension } from './nautilus-extension/uninstall';
import dns from 'node:dns';
import { registerAvailableUserProductsHandlers } from '../../backend/features/payments/ipc/register-available-user-products-handlers';
import { getAntivirusManager } from './antivirus/antivirusManager';
import { registerAuthIPCHandlers } from '../../infra/ipc/auth-ipc-handlers';
import { logger } from '@internxt/drive-desktop-core/build/backend';
import { trySetupAntivirusIpcAndInitialize } from './background-processes/antivirus/try-setup-antivirus-ipc-and-initialize';
import { getUserAvailableProductsAndStore } from '../../backend/features/payments/services/get-user-available-products-and-store';
import { handleDeeplink } from './auth/deeplink/handle-deeplink';
import { setupAppImageDeeplink } from './auth/deeplink/setup-appimage-deeplink';
import { version, release } from 'node:os';
import { INTERNXT_VERSION } from '../../core/utils/utils';
import { setUpBackups } from '../../backend/features/backup/setup-backups';

const gotTheLock = app.requestSingleInstanceLock();
app.setAsDefaultProtocolClient('internxt');

if (!gotTheLock) {
  app.quit();
}

registerAuthIPCHandlers();

logger.debug({
  msg: 'Starting app',
  version: INTERNXT_VERSION,
  isPackaged: app.isPackaged,
  osVersion: version(),
  osRelease: release(),
});

function checkForUpdates() {
  try {
    autoUpdater.logger = {
      debug: (msg) => logger.debug({ msg: `AutoUpdater: ${msg}` }),
      info: (msg) => logger.debug({ msg: `AutoUpdater: ${msg}` }),
      error: (msg) => logger.error({ msg: `AutoUpdater: ${msg}` }),
      warn: (msg) => logger.warn({ msg: `AutoUpdater: ${msg}` }),
    };
    autoUpdater.checkForUpdatesAndNotify();
  } catch (err: unknown) {
    logger.error({ msg: 'AutoUpdater Error:', err });
  }
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
}

app
  .whenReady()
  .then(async () => {
    /**
     * v.2.5.1
     * Esteban Galvis Triana
     * .AppImage users may experience login issues because the deeplink protocol
     * is not registered automatically, unlike with .deb packages.
     * This function manually registers the protocol handler for .AppImage installations.
     */
    await setupAppImageDeeplink();
    await installNautilusExtension();

    eventBus.emit('APP_IS_READY');
    const isLoggedIn = getIsLoggedIn();

    if (!isLoggedIn) {
      await createAuthWindow();
      setTrayStatus('IDLE');
    }

    checkForUpdates();
    registerAvailableUserProductsHandlers();
    getUserAvailableProductsAndStore({ forceStorage: true });
  })
  .catch((exc) => logger.error({ msg: 'Error starting app', exc }));

app.on('second-instance', async (_, argv) => {
  logger.debug({ tag: 'AUTH', msg: 'Deeplink received on second instance, processing...' });
  const deeplinkArg = argv.find((arg) => arg.startsWith('internxt://'));
  if (!deeplinkArg) return;

  try {
    await handleDeeplink({ url: deeplinkArg });
  } catch (error) {
    logger.error({ tag: 'AUTH', msg: 'Error handling deeplink', error });
  }
});

eventBus.on('WIDGET_IS_READY', () => {
  setUpBackups();
});

eventBus.on('USER_LOGGED_IN', async () => {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
      eventBus.emit('APP_DATA_SOURCE_INITIALIZED');
    }

    getAuthWindow()?.hide();

    nativeTheme.themeSource = (configStore.get('preferedTheme') || 'system') as Theme;

    setTrayStatus('IDLE');
    const widget = await getOrCreateWidged();
    const tray = getTray();
    if (widget && tray) {
      setBoundsOfWidgetByPath(widget, tray);
    }

    setTimeout(() => {
      const authWin = getAuthWindow();
      if (authWin && !authWin.isDestroyed()) {
        authWin.destroy();
      }
    }, 300);

    const lastOnboardingShown = configStore.get('lastOnboardingShown');

    if (!lastOnboardingShown) {
      openOnboardingWindow();
    } else if (widget) {
      widget.show();
    }

    await trySetupAntivirusIpcAndInitialize();
  } catch (error) {
    logger.error({
      msg: 'Error on main process while handling USER_LOGGED_IN event:',
      error,
    });
    reportError(error as Error);
  }
});

eventBus.on('USER_LOGGED_OUT', async () => {
  setTrayStatus('IDLE');
  const widget = getWidget();

  if (widget) {
    widget?.hide();

    void getAntivirusManager().shutdown();
  }

  await createAuthWindow();

  if (widget) {
    widget.destroy();
  }
  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy();
  }

  await uninstallNautilusExtension();
});

process.on('uncaughtException', (error) => {
  /**
   * v.2.5.1
   * Esteban Galvis Triana
   * EPIPE errors close stdout, so they must be handled specially to avoid infinite logging loops.
   */
  if ('code' in error && error.code === 'EPIPE') return;

  if (error.name === 'AbortError') {
    logger.debug({ msg: 'Fetch request was aborted' });
  } else {
    try {
      logger.error({ msg: 'Uncaught exception in main process: ', error });
    } catch {
      return;
    }
  }
});

ipcMain.handle('check-internet-connection', async () => {
  return new Promise((resolve) => {
    dns.lookup('google.com', (err) => {
      resolve(!err);
    });

    setTimeout(() => resolve(false), 3000);
  });
});
