/* eslint no-console: off, promise/always-return: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `npm run build` or `npm run build:main`, this file is compiled to
 * `./src/main.js` using webpack. This gives us some performance wins.
 */
import 'core-js/stable';
import 'regenerator-runtime/runtime';
import './logger';

import path from 'path';
import {
  app,
  BrowserWindow,
  shell,
  ipcMain,
  screen,
  powerSaveBlocker,
} from 'electron';
import { autoUpdater } from 'electron-updater';
import Logger from 'electron-log';
import * as uuid from 'uuid';
import { resolveHtmlPath } from './util';
import * as Auth from './auth';
import { AccessResponse } from '../renderer/pages/Login/service';
import { setupRootFolder } from './root-folder';
import TrayMenu from './tray';
import dimentions from './widget-bounds';
import configStore from './config';
import { SyncArgs, SyncInfoUpdatePayload } from '../workers/sync';
import locksService from './locks-service';
import { SyncFatalErrorName, SyncResult } from '../workers/sync/sync';

require('dotenv').config();

const isDevelopment =
  process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

const RESOURCES_PATH = app.isPackaged
  ? path.join(process.resourcesPath, 'assets')
  : path.join(__dirname, '../../assets');

export default class AppUpdater {
  constructor() {
    autoUpdater.logger = Logger;
    autoUpdater.checkForUpdatesAndNotify();
  }
}

let widget: BrowserWindow | null = null;
let tray: TrayMenu | null = null;

let currentWidgetPath = '/';

if (process.platform === 'darwin') app.dock.hide();

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

if (isDevelopment) {
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

const createWidget = async () => {
  if (isDevelopment) {
    await installExtensions();
  }

  const getAssetPath = (...paths: string[]): string => {
    return path.join(RESOURCES_PATH, ...paths);
  };

  widget = new BrowserWindow({
    show: false,
    icon: getAssetPath('icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
    movable: false,
    frame: false,
    resizable: false,
    maximizable: false,
    skipTaskbar: true,
  });

  widget.loadURL(resolveHtmlPath('index.html'));

  widget.on('ready-to-show', () => {
    if (!widget) {
      throw new Error('"widget" is not defined');
    }
    if (process.env.START_MINIMIZED) {
      widget.minimize();
    } else {
      widget.show();
    }
  });

  widget.on('blur', () => {
    widget?.hide();
  });

  // Open urls in the user's browser
  widget.webContents.on('new-window', (event, url) => {
    event.preventDefault();
    shell.openExternal(url);
  });

  widget.webContents.on('ipc-message', (_, channel) => {
    if (channel === 'user-closed-window') widget?.close();
  });

  // Remove this if your app does not use auto updates
  // eslint-disable-next-line
  new AppUpdater();
};

function toggleWidgetVisibility() {
  if (!widget) {
    return;
  }

  if (widget.isVisible()) widget.hide();
  else widget.show();
}

function getLocationUnderTray(
  { width, height }: { width: number; height: number },
  bounds: Electron.Rectangle
): { x: number; y: number } {
  const display = screen.getDisplayMatching(bounds);
  let x = Math.min(
    bounds.x - display.workArea.x - width / 2,
    display.workArea.width - width
  );
  x += display.workArea.x;
  x = Math.max(display.workArea.x, x);
  let y = Math.min(
    bounds.y - display.workArea.y - height / 2,
    display.workArea.height - height
  );
  y += display.workArea.y;
  y = Math.max(display.workArea.y, y);
  return {
    x,
    y,
  };
}

function setBoundsOfWidgetByPath(pathname = currentWidgetPath) {
  const { placeUnderTray, ...size } = dimentions[pathname];

  const bounds = tray?.bounds;

  if (placeUnderTray && bounds) {
    const location = getLocationUnderTray(size, bounds);
    widget?.setBounds({ ...size, ...location });
  } else {
    widget?.center();
    widget?.setBounds(size);
  }
}

app.on('window-all-closed', () => {
  app.quit();
});

app
  .whenReady()
  .then(() => {
    setupTrayIcon();
    createWidget();
  })
  .catch(console.log);

// Tray icon

function setupTrayIcon() {
  const iconsPath = path.join(RESOURCES_PATH, 'tray');

  function onTrayClick() {
    setBoundsOfWidgetByPath(currentWidgetPath);
    toggleWidgetVisibility();
  }

  function onQuitClick() {
    app.quit();
  }

  tray = new TrayMenu(iconsPath, onTrayClick, onQuitClick);
}

// Current widget pathname

ipcMain.on('path-changed', (_, pathname: string) => {
  console.log('Renderer navigated to ', pathname);

  currentWidgetPath = pathname;

  setBoundsOfWidgetByPath(pathname);
});

export function onUserUnauthorized() {}

ipcMain.on('user-is-unauthorized', onUserUnauthorized);

// Logged In handling

let isLoggedIn: boolean;

function setIsLoggedIn(value: boolean) {
  isLoggedIn = value;
  if (widget) widget.webContents.send('user-logged-in-changed', value);
}

ipcMain.handle('is-user-logged-in', () => isLoggedIn);

setIsLoggedIn(!!Auth.getUser());

// Login handling

ipcMain.on('user-logged-in', (_, data: AccessResponse) => {
  Auth.setCredentials(data.user, data.user.mnemonic, data.token);
  if (!Auth.canHisConfigBeRestored(data.user.uuid)) {
    setupRootFolder();
  }

  setIsLoggedIn(true);

  // startBackgroundProcesses()
});

// Logout handling

ipcMain.on('user-logged-out', () => {
  // stopBackgroundProcesses()
  // closeAuxWindows

  Auth.logout();

  setIsLoggedIn(false);
});

// Open sync folder handler

ipcMain.handle('open-sync-folder', () => {
  const syncFolderPath = configStore.get('syncRoot');
  return shell.openPath(syncFolderPath);
});

// Quit handling

ipcMain.on('user-quit', () => {
  app.quit();
});

// getUser handling

ipcMain.handle('get-user', () => {
  return Auth.getUser();
});

// getHeaders handling

ipcMain.handle('get-headers', () => {
  return Auth.getHeaders();
});

// Broadcast to renderers

function broadcastToRenderers(eventName: string, data: any) {
  widget?.webContents.emit(eventName, data);
}

/* SYNC */

export type SyncStatus = 'STANDBY' | 'RUNNING';

let syncStatus = 'STANDBY';
let syncProcessRerun: null | ReturnType<typeof setTimeout> = null;
const SYNC_INTERVAL = 10 * 60 * 1000;

ipcMain.on('start-sync-process', startSyncProcess);
ipcMain.handle('get-sync-status', () => syncStatus);

function setTraySyncStatus(newStatus: SyncStatus) {
  if (newStatus === 'RUNNING') {
    tray?.setState('SYNCING');
  } else if (syncIssues.length !== 0) {
    tray?.setState('ISSUES');
  } else {
    tray?.setState('STANDBY');
  }
}

function changeSyncStatus(newStatus: SyncStatus) {
  syncStatus = newStatus;
  broadcastToRenderers('sync-status-changed', newStatus);
  setTraySyncStatus(newStatus);
}

async function startSyncProcess() {
  if (syncStatus === 'RUNNING') {
    return;
  }

  const suspensionBlockId = powerSaveBlocker.start('prevent-app-suspension');

  changeSyncStatus('RUNNING');

  clearSyncIssues();

  // It's an object to pass it to
  // the individual item processors
  const hasBeenStopped = { value: false };

  ipcMain.once('stop-sync-process', () => {
    hasBeenStopped.value = true;
  });

  const item = {
    folderId: Auth.getUser()?.root_folder_id as number,
    localPath: configStore.get('syncRoot'),
    tmpPath: app.getPath('temp'),
  };
  await processSyncItem(item, hasBeenStopped);

  const currentTimestamp = new Date().valueOf();

  configStore.set('lastSync', currentTimestamp);

  if (syncProcessRerun) {
    clearTimeout(syncProcessRerun);
  }
  syncProcessRerun = setTimeout(startSyncProcess, SYNC_INTERVAL);

  changeSyncStatus('STANDBY');

  ipcMain.removeAllListeners('stop-sync-process');

  powerSaveBlocker.stop(suspensionBlockId);
}

export type SyncStoppedPayload =
  | { reason: 'STOPPED_BY_USER' | 'COULD_NOT_ACQUIRE_LOCK' }
  | {
      reason: 'FATAL_ERROR';
      errorName: SyncFatalErrorName;
    }
  | { reason: 'EXIT'; result: SyncResult };

function processSyncItem(item: SyncArgs, hasBeenStopped: { value: boolean }) {
  return new Promise<void>(async (resolve) => {
    const onExitFuncs: (() => void)[] = [];

    function onExit(payload: SyncStoppedPayload) {
      Logger.log(
        `[onSyncExit] (${payload.reason}) ${
          payload.reason === 'FATAL_ERROR' ? payload.errorName : ''
        } ${payload.reason === 'EXIT' ? payload.result.status : ''}`
      );
      onExitFuncs.forEach((f) => f());
      broadcastToRenderers('sync-stopped', payload);

      resolve();
    }

    function onAcquireLockError(err: any) {
      Logger.log('Could not acquire lock', err);
      onExit({ reason: 'COULD_NOT_ACQUIRE_LOCK' });
    }

    try {
      const lockId = uuid.v4();
      await locksService.acquireLock(item.folderId, lockId);
      onExitFuncs.push(() => locksService.releaseLock(item.folderId, lockId));

      const lockRefreshInterval = setInterval(() => {
        locksService
          .refreshLock(item.folderId, lockId)
          .catch(() => {
            // If we fail to refresh the lock
            // we try to acquire it again
            // before stopping everything
            return locksService.acquireLock(item.folderId, lockId);
          })
          .catch(onAcquireLockError);
      }, 7000);
      onExitFuncs.push(() => clearInterval(lockRefreshInterval));

      // So the interval is cleared before the lock is released
      onExitFuncs.reverse();
    } catch (err) {
      return onAcquireLockError(err);
    }

    if (hasBeenStopped.value) {
      return onExit({ reason: 'STOPPED_BY_USER' });
    }

    ipcMain.handle('get-sync-details', () => item);
    onExitFuncs.push(() => ipcMain.removeHandler('get-sync-details'));

    ipcMain.once('SYNC_FATAL_ERROR', (_, errorName) =>
      onExit({ reason: 'FATAL_ERROR', errorName })
    );
    onExitFuncs.push(() => ipcMain.removeAllListeners('SYNC_FATAL_ERROR'));

    ipcMain.once('SYNC_EXIT', (_, result) =>
      onExit({ reason: 'EXIT', result })
    );
    onExitFuncs.push(() => ipcMain.removeAllListeners('SYNC_EXIT'));

    const worker = spawnSyncWorker();
    onExitFuncs.push(() => worker.destroy());

    if (hasBeenStopped.value) {
      return onExit({ reason: 'STOPPED_BY_USER' });
    }

    const onUserStopped = () => onExit({ reason: 'STOPPED_BY_USER' });
    ipcMain.once('stop-sync-process', onUserStopped);
    onExitFuncs.push(() =>
      ipcMain.removeListener('stop-sync-process', onUserStopped)
    );
  });
}

function spawnSyncWorker() {
  const worker = new BrowserWindow({
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
    show: false,
  });

  worker
    .loadFile(
      process.env.NODE_ENV === 'development'
        ? '../../release/app/dist/sync/index.html'
        : `${path.join(__dirname, '..', 'sync')}/index.html`
    )
    .catch(Logger.error);

  return worker;
}

ipcMain.on('SYNC_INFO_UPDATE', (_, payload: SyncInfoUpdatePayload) => {
  broadcastToRenderers('sync-info-update', payload);
});

// Sync issues

let syncIssues: SyncInfoUpdatePayload[] = [];

function onSyncIssuesChanged() {
  broadcastToRenderers('sync-issues-changed', syncIssues);
}

function clearSyncIssues() {
  syncIssues = [];
  onSyncIssuesChanged();
}

ipcMain.on('SYNC_INFO_UPDATE', (_, payload: SyncInfoUpdatePayload) => {
  if (
    [
      'PULL_ERROR',
      'RENAME_ERROR',
      'DELETE_ERROR',
      'METADATA_READ_ERROR',
    ].includes(payload.action)
  ) {
    syncIssues.push(payload);
    onSyncIssuesChanged();
  }
});

ipcMain.handle('get-sync-issues', () => syncIssues);
