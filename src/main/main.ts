import 'core-js/stable';
import 'regenerator-runtime/runtime';

import { app, ipcMain } from 'electron';
import { autoUpdater } from 'electron-updater';
import Logger from 'electron-log';
import packageJson from '../../package.json';

import eventBus from './event-bus';

// Only effective during development
// the variables are injected
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
import './background-processes/process-issues';
import './device/handlers';
import './usage/handlers';
import './realtime';
import './tray';
import './analytics/handlers';
import './platform/handlers';

Logger.log(`Running ${packageJson.version}`);

function checkForUpdates() {
  autoUpdater.logger = Logger;
  autoUpdater.checkForUpdatesAndNotify();
}

if (process.platform === 'darwin') app.dock.hide();

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

if (process.env.NODE_ENV === 'development') {
  require('electron-debug')({ showDevTools: false });
}

const installExtensions = async () => {
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

app.on('window-all-closed', () => {
  app.quit();
});

ipcMain.on('user-quit', () => {
  app.quit();
});

app
  .whenReady()
  .then(async () => {
    eventBus.emit('APP_IS_READY');

    if (process.env.NODE_ENV === 'development') {
      await installExtensions();
    }
    checkForUpdates();
  })
  .catch(Logger.error);
