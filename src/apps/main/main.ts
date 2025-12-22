import { app } from 'electron';

import 'reflect-metadata';
import 'core-js/stable';
import 'regenerator-runtime/runtime';
// Only effective during development
// the variables are injected if process.env.NODE_ENV === 'production'
// via webpack in prod
import 'dotenv/config';

// ***** APP BOOTSTRAPPING ****************************************************** //
import { PATHS } from '@/core/electron/paths';
import { setupElectronLog } from '@internxt/drive-desktop-core/build/backend';

setupElectronLog({ logsPath: PATHS.LOGS });

import { setupAutoLaunchHandlers } from './auto-launch/handlers';
import { checkIfUserIsLoggedIn, emitUserLoggedIn, setIsLoggedIn, setupAuthIpcHandlers } from './auth/handlers';
import './windows/settings';
import './windows/process-issues';
import './device/handlers';
import './ipcs/ipcMainAntivirus';
import './remote-sync/handlers';

import { autoUpdater } from 'electron-updater';
import eventBus from './event-bus';
import { AppDataSource } from './database/data-source';
import { getOrCreateWidged, setBoundsOfWidgetByPath } from './windows/widget';
import { createAuthWindow, getAuthWindow } from './windows/auth';
import { electronStore } from './config';
import { getTray, setTrayStatus, setupTrayIcon } from './tray/tray';
import { openOnboardingWindow } from './windows/onboarding';
import { setupQuitHandlers } from './quit';
import { migrate } from '@/migrations/migrate';
import { setUpBackups } from './background-processes/backups/setUpBackups';
import { setupIssueHandlers } from './background-processes/issues';
import { logger } from '../shared/logger/logger';
import { INTERNXT_APP_ID, INTERNXT_PROTOCOL, INTERNXT_VERSION } from '@/core/utils/utils';
import { setupPreloadIpc } from './preload/ipc-main';
import { setupThemeListener } from './config/theme';
import { release, version } from 'node:os';
import { Marketing } from '@/backend/features';
import { processDeeplink } from './electron/deeplink/process-deeplink';
import { resolve } from 'node:path';

if (process.defaultApp) {
  if (process.argv.length >= 2) {
    /**
     * v2.6.2 Daniel Jiménez
     * To be able to use main.js we must first build it using `npm run build:main`.
     */
    logger.debug({ msg: 'Registering protocol in dev mode' });
    app.setAsDefaultProtocolClient(INTERNXT_PROTOCOL, process.execPath, [resolve('./dist/main/main.js')]);
  }
} else {
  logger.debug({ msg: 'Registering protocol' });
  app.setAsDefaultProtocolClient(INTERNXT_PROTOCOL);
}

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
  process.exit(0);
} else {
  app.on('second-instance', (event, argv) => {
    processDeeplink({ argv });
  });
}

setupAutoLaunchHandlers();
setupAuthIpcHandlers();
setupPreloadIpc();
setupThemeListener();
setupQuitHandlers();
setupIssueHandlers();

logger.debug({
  msg: 'Starting app',
  gotTheLock,
  version: INTERNXT_VERSION,
  isPackaged: app.isPackaged,
  osVersion: version(),
  osRelease: release(),
});

async function checkForUpdates() {
  autoUpdater.logger = {
    debug: (msg) => logger.debug({ msg: `AutoUpdater: ${msg}` }),
    info: (msg) => logger.debug({ msg: `AutoUpdater: ${msg}` }),
    error: (msg) => logger.error({ msg: `AutoUpdater: ${msg}` }),
    warn: (msg) => logger.warn({ msg: `AutoUpdater: ${msg}` }),
  };
  await autoUpdater.checkForUpdatesAndNotify();
}

if (process.env.NODE_ENV === 'production') {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

app
  .whenReady()
  .then(async () => {
    app.setAppUserModelId(INTERNXT_APP_ID);

    await AppDataSource.initialize();

    setupTrayIcon();

    await migrate();

    setUpBackups();

    const isLoggedIn = await checkIfUserIsLoggedIn();

    if (isLoggedIn) {
      await emitUserLoggedIn();
    } else {
      setIsLoggedIn(false);
      await createAuthWindow();
      setTrayStatus('IDLE');
    }

    await checkForUpdates();
  })
  .catch((exc) => logger.error({ msg: 'Error starting app', exc }));

eventBus.on('USER_LOGGED_IN', async () => {
  try {
    getAuthWindow()?.hide();

    const widget = await getOrCreateWidged();
    const tray = getTray();
    if (widget && tray) {
      setBoundsOfWidgetByPath(widget, tray);
    }

    getAuthWindow()?.destroy();

    const lastOnboardingShown = electronStore.get('lastOnboardingShown');

    if (!lastOnboardingShown) {
      openOnboardingWindow();
    } else if (widget) {
      widget.show();
    }

    void Marketing.showNotifications();
  } catch (exc) {
    logger.error({ msg: 'Error logging in', exc });
    reportError(exc as Error);
  }
});
