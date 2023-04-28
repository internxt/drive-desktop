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

const modules = [
'./sync-root-folder/handlers',
'./auto-launch/handlers',
'./logger',
'./bug-report/handlers',
'./auth/handlers',
'./windows/settings',
'./windows/process-issues',
'./windows',
'./background-processes/backups',
'./background-processes/sync',
'./background-processes/process-issues',
'./device/handlers',
'./usage/handlers',
'./realtime',
'./tray',
'./analytics/handlers',
'./platform/handlers',
'./thumbnails/handlers',
'./config/handlers',
'./app-info/handlers',
'./faulty-module',
];

for(let module of modules) {
  require(module);
}

process.on('uncaughtException', () => {
  Logger.error(`[MAIN] Uncaught Exception`);
});

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
  require('./dev/handlers');
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
