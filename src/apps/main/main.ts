import { app, ipcMain, nativeTheme } from 'electron';
import Logger from 'electron-log';

void app.whenReady().then(() => {
  app.setAppUserModelId('com.internxt.app');
});

import 'reflect-metadata';
import 'core-js/stable';
import 'regenerator-runtime/runtime';

// Only effective during development
// the variables are injectedif (process.env.NODE_ENV === 'production') {

// via webpack in prod
import 'dotenv/config';
// ***** APP BOOTSTRAPPING ****************************************************** //
import { setupElectronLog } from './logger';

setupElectronLog();

import { setupVirtualDriveHandlers } from './virtual-root-folder/handlers';
import { setupAutoLaunchHandlers } from './auto-launch/handlers';
import { setupBugReportHandlers } from './bug-report/handlers';
import { checkIfUserIsLoggedIn, setupAuthIpcHandlers } from './auth/handlers';
import './windows/settings';
import './windows/process-issues';
import './windows';
import './background-processes/sync-engine';
import './background-processes/process-issues';
import './device/handlers';
import './usage/handlers';
import './realtime';
import './fordwardToWindows';
import './ipcs/ipcMainAntivirus';
import './platform/handlers';
import './migration/handlers';
import './config/handlers';
import './app-info/handlers';
import './remote-sync/handlers';

import { setupSettingsIPCHandlers } from './windows/ipc/setup-ipc-handlers';
import { autoUpdater } from 'electron-updater';
import packageJson from '../../../package.json';
import eventBus from './event-bus';
import { AppDataSource } from './database/data-source';
import { getIsLoggedIn } from './auth/handlers';
import { getOrCreateWidged, getWidget, setBoundsOfWidgetByPath } from './windows/widget';
import { createAuthWindow, getAuthWindow } from './windows/auth';
import configStore from './config';
import { getTray, setTrayStatus, setupTrayIcon } from './tray/tray';
import { openOnboardingWindow } from './windows/onboarding';
import { Theme } from '../shared/types/Theme';
import { clearAntivirus, initializeAntivirusIfAvailable } from './antivirus/utils/initializeAntivirus';
import { registerUsageHandlers } from './usage/handlers';
import { setupQuitHandlers } from './quit';
import { clearConfig, setDefaultConfig } from '../sync-engine/config';
import { migrate } from '@/migrations/migrate';
import { unregisterVirtualDrives } from './background-processes/sync-engine/services/unregister-virtual-drives';
import { setUpBackups } from './background-processes/backups/setUpBackups';
import { setupIssueHandlers } from './background-processes/issues';
import { setupIpcDriveServerWip } from '@/infra/drive-server-wip/out/ipc-main';

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
}

setupAutoLaunchHandlers();
setupBugReportHandlers();
setupAuthIpcHandlers();
setupSettingsIPCHandlers();
setupVirtualDriveHandlers();
setupQuitHandlers();
setupIssueHandlers();
setupIpcDriveServerWip();

Logger.log(`Running ${packageJson.version}`);
Logger.log(`App is packaged: ${app.isPackaged}`);

async function checkForUpdates() {
  autoUpdater.logger = Logger;
  await autoUpdater.checkForUpdatesAndNotify();
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
    setDefaultConfig({});

    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    setupTrayIcon();

    await migrate();

    registerUsageHandlers();
    await setUpBackups();

    await checkIfUserIsLoggedIn();
    const isLoggedIn = getIsLoggedIn();

    if (!isLoggedIn) {
      await createAuthWindow();
      setTrayStatus('IDLE');
    }

    ipcMain.handle('is-dark-mode-active', () => {
      return nativeTheme.shouldUseDarkColors;
    });

    await checkForUpdates();
  })
  .catch(Logger.error);

eventBus.on('USER_LOGGED_IN', async () => {
  try {
    setDefaultConfig({});

    getAuthWindow()?.hide();

    nativeTheme.themeSource = (configStore.get('preferedTheme') || 'system') as Theme;

    const widget = await getOrCreateWidged();
    const tray = getTray();
    if (widget && tray) {
      setBoundsOfWidgetByPath(widget, tray);
    }

    getAuthWindow()?.destroy();

    const lastOnboardingShown = configStore.get('lastOnboardingShown');

    if (!lastOnboardingShown) {
      openOnboardingWindow();
    } else if (widget) {
      widget.show();
    }

    await initializeAntivirusIfAvailable();
  } catch (error) {
    Logger.error(error);
    reportError(error as Error);
  }
});

eventBus.on('USER_LOGGED_OUT', async () => {
  setTrayStatus('IDLE');

  clearConfig();

  const widget = getWidget();
  if (widget) {
    widget.hide();
    widget.destroy();
  }

  await clearAntivirus();
  unregisterVirtualDrives({});

  await createAuthWindow();
});
